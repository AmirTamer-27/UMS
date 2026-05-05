import { supabase } from "../../../services/supabase";

const getCourseLabel = (offering) => {
  const courseCode = offering.courses?.code;
  const courseName = offering.courses?.name;
  const semesterName = offering.semesters?.name;
  const courseLabel =
    courseCode && courseName
      ? `${courseCode} - ${courseName}`
      : courseName || "Course offering";

  return semesterName ? `${courseLabel} (${semesterName})` : courseLabel;
};

export const fetchInstructorStudentRoster = async (instructorUserId) => {
  if (!supabase) {
    throw new Error("Supabase is not configured.");
  }

  if (!instructorUserId) {
    return {
      courseOfferings: [],
      departments: [],
      students: [],
    };
  }

  const { data: courseOfferings, error: offeringsError } = await supabase
    .from("course_offerings")
    .select("id, courses(name, code), semesters(name)")
    .eq("instructor_user_id", instructorUserId)
    .order("created_at", { ascending: false });

  if (offeringsError) {
    throw offeringsError;
  }

  const offerings = courseOfferings || [];
  const offeringIds = offerings.map((offering) => offering.id).filter(Boolean);

  if (!offeringIds.length) {
    return {
      courseOfferings: [],
      departments: [],
      students: [],
    };
  }

  const { data: registrations, error: registrationsError } = await supabase
    .from("registrations")
    .select("student_user_id, course_offering_id")
    .in("course_offering_id", offeringIds)
    .eq("status", "registered");

  if (registrationsError) {
    throw registrationsError;
  }

  const studentIds = [
    ...new Set((registrations || []).map((item) => item.student_user_id)),
  ].filter(Boolean);

  if (!studentIds.length) {
    return {
      courseOfferings: offerings,
      departments: [],
      students: [],
    };
  }

  const { data: studentProfiles, error: studentsError } = await supabase
    .from("profiles")
    .select(
      `
        id,
        full_name,
        email,
        department_id,
        departments(id, name, code),
        student_profiles(student_number, level, status)
      `,
    )
    .in("id", studentIds)
    .eq("role", "student")
    .order("full_name", { ascending: true });

  if (studentsError) {
    throw studentsError;
  }

  const offeringsById = new Map(
    offerings.map((offering) => [
      offering.id,
      {
        ...offering,
        label: getCourseLabel(offering),
      },
    ]),
  );
  const courseIdsByStudent = new Map();

  (registrations || []).forEach((registration) => {
    if (!registration.student_user_id || !registration.course_offering_id) {
      return;
    }

    const currentCourseIds =
      courseIdsByStudent.get(registration.student_user_id) || [];
    courseIdsByStudent.set(registration.student_user_id, [
      ...currentCourseIds,
      registration.course_offering_id,
    ]);
  });

  const students = (studentProfiles || []).map((student) => ({
    ...student,
    enrolledCourses: (courseIdsByStudent.get(student.id) || [])
      .map((courseOfferingId) => offeringsById.get(courseOfferingId))
      .filter(Boolean),
  }));

  const departments = Array.from(
    new Map(
      students
        .map((student) => student.departments)
        .filter(Boolean)
        .map((department) => [department.id, department]),
    ).values(),
  ).sort((first, second) => first.name.localeCompare(second.name));

  return {
    courseOfferings: offerings,
    departments,
    students,
  };
};

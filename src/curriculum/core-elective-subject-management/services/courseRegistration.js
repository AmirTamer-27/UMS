import { supabase } from "../../../services/supabase/client";

const QUERY_TIMEOUT_MS = 10000;
const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const requireSupabase = () => {
  if (!supabase) {
    throw new Error(
      "Supabase is not configured. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to your local environment.",
    );
  }

  return supabase;
};

const withTimeout = async (promise, label) => {
  let timeoutId;

  const timeoutPromise = new Promise((_, reject) => {
    timeoutId = window.setTimeout(() => {
      reject(
        new Error(
          `${label} is taking too long. Check your Supabase connection and row-level security policies.`,
        ),
      );
    }, QUERY_TIMEOUT_MS);
  });

  try {
    return await Promise.race([promise, timeoutPromise]);
  } finally {
    window.clearTimeout(timeoutId);
  }
};

const fetchRows = async (query) => {
  const { data, error } = await query;

  if (error) {
    throw error;
  }

  return data ?? [];
};

const getStudentContext = async (client, profile) => {
  if (!profile?.id) {
    throw new Error("No authenticated profile was available.");
  }

  if (!UUID_PATTERN.test(profile.department_id || "")) {
    throw new Error(
      "Your student profile is missing a valid department. Ask an admin to update your student record.",
    );
  }

  const {
    data: studentProfile,
    error: studentProfileError,
    status: studentProfileStatus,
    statusText: studentProfileStatusText,
  } = await withTimeout(
    client
      .from("student_profiles")
      .select("user_id, level, status")
      .eq("user_id", profile.id)
      .maybeSingle(),
    "Loading student_profiles",
  );

  if (studentProfileError) {
    throw new Error(
      `Unable to read student_profiles for ${profile.id}. Status ${
        studentProfileStatus || "unknown"
      } ${studentProfileStatusText || ""}. ${studentProfileError.message}`,
    );
  }

  if (profile.role !== "student") {
    throw new Error("Only students can access course registration.");
  }

  if (!studentProfile) {
    throw new Error(
      `No student_profiles row was visible for auth user ${profile.id}.`,
    );
  }

  return { profile, studentProfile };
};

const getActiveSemester = async (client) => {
  const { data, error } = await client
    .from("semesters")
    .select("id, name, start_date, end_date")
    .eq("is_active", true)
    .limit(1)
    .maybeSingle();

  if (error) {
    throw error;
  }

  if (!data) {
    throw new Error("There is no active semester available right now.");
  }

  return data;
};

const getOfferings = async (client, semesterId) => {
  const { data, error } = await client
    .from("course_offerings")
    .select("id, course_id, semester_id, instructor_user_id, seat_limit, published")
    .eq("semester_id", semesterId)
    .eq("published", true);

  if (error) {
    throw error;
  }

  return data ?? [];
};

const getCourses = async (client, courseIds, departmentId, level) => {
  if (!courseIds.length) {
    return [];
  }

  const { data, error } = await client
    .from("courses")
    .select(
      "id, code, name, description, credit_hours, course_type, recommended_level, department_id",
    )
    .in("id", courseIds)
    .eq("department_id", departmentId)
    .eq("recommended_level", level);

  if (error) {
    throw error;
  }

  return data ?? [];
};

const getInstructorMap = async (client, instructorIds) => {
  if (!instructorIds.length) {
    return new Map();
  }

  const { data, error } = await client
    .from("profiles")
    .select("id, full_name")
    .in("id", instructorIds);

  if (error) {
    throw error;
  }

  return new Map((data ?? []).map((profile) => [profile.id, profile.full_name]));
};

const getRegisteredCounts = async (client, offeringIds) => {
  if (!offeringIds.length) {
    return new Map();
  }

  const { data, error } = await client
    .from("registrations")
    .select("course_offering_id, status")
    .in("course_offering_id", offeringIds)
    .eq("status", "registered");

  if (error) {
    throw error;
  }

  const counts = new Map();

  (data ?? []).forEach(({ course_offering_id: offeringId }) => {
    counts.set(offeringId, (counts.get(offeringId) ?? 0) + 1);
  });

  return counts;
};

const getStudentRegistrations = async (client, studentUserId, offeringIds) => {
  if (!offeringIds.length) {
    return [];
  }

  return fetchRows(
    client
      .from("registrations")
      .select("id, course_offering_id, status, created_at")
      .eq("student_user_id", studentUserId)
      .in("course_offering_id", offeringIds)
      .in("status", ["selected", "registered"]),
  );
};

export const courseRegistrationService = {
  getAvailableCoursesForStudent: async (profile) => {
    if (!profile?.id) {
      throw new Error("A logged-in student profile is required.");
    }

    const client = requireSupabase();
    const { studentProfile } = await getStudentContext(client, profile);
    const activeSemester = await withTimeout(
      getActiveSemester(client),
      "Loading the active semester",
    );
    const offerings = await withTimeout(
      getOfferings(client, activeSemester.id),
      "Loading the published course offerings",
    );

    if (!offerings.length) {
      return {
        activeSemester,
        student: {
          id: profile.id,
          fullName: profile.full_name,
          departmentId: profile.department_id,
          level: studentProfile.level,
        },
        offerings: [],
      };
    }

    const courses = await withTimeout(
      getCourses(
        client,
        [...new Set(offerings.map((offering) => offering.course_id))],
        profile.department_id,
        studentProfile.level,
      ),
      "Loading the matching courses",
    );

    const coursesById = new Map(courses.map((course) => [course.id, course]));
    const matchingOfferings = offerings.filter((offering) =>
      coursesById.has(offering.course_id),
    );

    const [instructorNames, registeredCounts, studentRegistrations] = await withTimeout(
      Promise.all([
        getInstructorMap(
          client,
          [
            ...new Set(
              matchingOfferings
                .map((offering) => offering.instructor_user_id)
                .filter(Boolean),
            ),
          ],
        ),
        getRegisteredCounts(
          client,
          matchingOfferings.map((offering) => offering.id),
        ),
        getStudentRegistrations(
          client,
          profile.id,
          matchingOfferings.map((offering) => offering.id),
        ),
      ]),
      "Loading instructors and registration counts",
    );
    const registrationsByOfferingId = new Map(
      studentRegistrations.map((registration) => [
        registration.course_offering_id,
        registration,
      ]),
    );

    return {
      activeSemester,
      student: {
        id: profile.id,
        fullName: profile.full_name,
        departmentId: profile.department_id,
        level: studentProfile.level,
      },
      offerings: matchingOfferings.map((offering) => {
        const course = coursesById.get(offering.course_id);
        const registeredCount = registeredCounts.get(offering.id) ?? 0;
        const seatLimit = offering.seat_limit ?? 0;

        return {
          id: offering.id,
          courseId: offering.course_id,
          courseCode: course.code,
          courseName: course.name,
          description: course.description,
          creditHours: course.credit_hours,
          courseType: course.course_type,
          recommendedLevel: course.recommended_level,
          instructorName:
            instructorNames.get(offering.instructor_user_id) ?? "Staff TBA",
          seatLimit,
          registeredCount,
          availableSeats: Math.max(seatLimit - registeredCount, 0),
          registration: registrationsByOfferingId.get(offering.id) || null,
          registrationStatus:
            registrationsByOfferingId.get(offering.id)?.status || null,
        };
      }),
    };
  },

  selectCourse: async ({ courseOfferingId, studentUserId }) => {
    const client = requireSupabase();

    const { data: existingRegistration, error: existingError } = await client
      .from("registrations")
      .select("id, status")
      .eq("student_user_id", studentUserId)
      .eq("course_offering_id", courseOfferingId)
      .maybeSingle();

    if (existingError) {
      throw existingError;
    }

    if (existingRegistration?.status === "registered") {
      throw new Error("This course is already registered.");
    }

    if (existingRegistration) {
      const { error } = await client
        .from("registrations")
        .update({ status: "selected" })
        .eq("id", existingRegistration.id);

      if (error) {
        throw error;
      }

      return;
    }

    const { error } = await client.from("registrations").insert({
      student_user_id: studentUserId,
      course_offering_id: courseOfferingId,
      status: "selected",
    });

    if (error) {
      throw error;
    }
  },

  removeSelectedCourse: async ({ courseOfferingId, studentUserId }) => {
    const client = requireSupabase();
    const { error } = await client
      .from("registrations")
      .delete()
      .eq("student_user_id", studentUserId)
      .eq("course_offering_id", courseOfferingId)
      .eq("status", "selected");

    if (error) {
      throw error;
    }
  },

  registerSelectedCourses: async ({ courseOfferingIds, studentUserId }) => {
    if (!courseOfferingIds.length) {
      throw new Error("Select at least one course before registering.");
    }

    const client = requireSupabase();
    const { error } = await client
      .from("registrations")
      .update({ status: "registered" })
      .eq("student_user_id", studentUserId)
      .in("course_offering_id", courseOfferingIds)
      .eq("status", "selected");

    if (error) {
      throw error;
    }
  },
};

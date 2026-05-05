import { supabase } from "../../../services/supabase";

export const PROFESSOR_DIRECTORY_PAGE_SIZE = 8;

export const fetchProfessorDirectory = async ({
  departmentId = "",
  page = 0,
  pageSize = PROFESSOR_DIRECTORY_PAGE_SIZE,
  search = "",
} = {}) => {
  if (!supabase) {
    throw new Error("Supabase is not configured.");
  }

  const from = page * pageSize;
  const to = from + pageSize - 1;
  const searchTerm = search.trim();

  let query = supabase
    .from("profiles")
    .select(
      `
        id,
        full_name,
        email,
        role,
        department_id,
        departments(id, name, code),
        staff_profiles(staff_number, title, office_hours, bio)
      `,
      { count: "exact" },
    )
    .in("role", ["teacher", "staff"])
    .order("full_name", { ascending: true })
    .range(from, to);

  if (searchTerm) {
    query = query.ilike("full_name", `%${searchTerm}%`);
  }

  if (departmentId) {
    query = query.eq("department_id", departmentId);
  }

  const { data, error, count } = await query;

  if (error) {
    throw error;
  }

  return {
    hasMore: count === null ? (data || []).length === pageSize : to + 1 < count,
    professors: data || [],
    total: count || 0,
  };
};

export const fetchDepartments = async () => {
  if (!supabase) {
    throw new Error("Supabase is not configured.");
  }

  const { data, error } = await supabase
    .from("departments")
    .select("id, name, code")
    .order("name", { ascending: true });

  if (error) {
    throw error;
  }

  return data || [];
};

export const fetchStudentInstructors = async (studentUserId) => {
  if (!supabase) {
    throw new Error("Supabase is not configured.");
  }

  if (!studentUserId) {
    return [];
  }

  const { data: registrations, error: registrationsError } = await supabase
    .from("registrations")
    .select("course_offering_id")
    .eq("student_user_id", studentUserId)
    .eq("status", "registered");

  if (registrationsError) {
    throw registrationsError;
  }

  const offeringIds = (registrations || [])
    .map((registration) => registration.course_offering_id)
    .filter(Boolean);

  if (!offeringIds.length) {
    return [];
  }

  const { data: offerings, error: offeringsError } = await supabase
    .from("course_offerings")
    .select(
      `
        instructor_user_id,
        courses(name, code),
        semesters(name),
        instructor:profiles!course_offerings_instructor_user_id_fkey (
          id,
          full_name,
          email,
          departments(id, name, code)
        )
      `,
    )
    .in("id", offeringIds)
    .order("created_at", { ascending: true });

  if (offeringsError) {
    throw offeringsError;
  }

  return Array.from(
    new Map(
      (offerings || [])
        .filter((offering) => offering.instructor_user_id && offering.instructor)
        .map((offering) => [
          offering.instructor_user_id,
          {
            ...offering.instructor,
            courseLabel:
              offering.courses?.code && offering.courses?.name
                ? `${offering.courses.code} - ${offering.courses.name}`
                : offering.courses?.name || "Registered course",
          },
        ]),
    ).values(),
  );
};

export const fetchConversationMessages = async ({
  studentUserId,
  staffUserId,
} = {}) => {
  if (!supabase) {
    throw new Error("Supabase is not configured.");
  }

  if (!studentUserId || !staffUserId) {
    return [];
  }

  const { data: conversation, error: conversationError } = await supabase
    .from("conversations")
    .select("id")
    .eq("student_user_id", studentUserId)
    .eq("teacher_user_id", staffUserId)
    .is("parent_user_id", null)
    .maybeSingle();

  if (conversationError) {
    throw conversationError;
  }

  if (!conversation) {
    return [];
  }

  const { data: messages, error: messagesError } = await supabase
    .from("messages")
    .select("*")
    .eq("conversation_id", conversation.id)
    .order("created_at", { ascending: true });

  if (messagesError) {
    throw messagesError;
  }

  return messages || [];
};

export const sendStudentStaffMessage = async ({
  message,
  senderUserId,
  staffUserId,
  studentUserId,
} = {}) => {
  if (!supabase) {
    throw new Error("Supabase is not configured.");
  }

  const body = message?.trim();

  if (!body) {
    throw new Error("Message is required.");
  }

  if (!senderUserId || !studentUserId || !staffUserId) {
    throw new Error("A student and staff member are required.");
  }

  const { data: existing, error: existingError } = await supabase
    .from("conversations")
    .select("id")
    .eq("student_user_id", studentUserId)
    .eq("teacher_user_id", staffUserId)
    .is("parent_user_id", null)
    .maybeSingle();

  if (existingError) {
    throw existingError;
  }

  let conversationId = existing?.id;

  if (!conversationId) {
    const { data: conversation, error: conversationError } = await supabase
      .from("conversations")
      .insert({
        parent_user_id: null,
        student_user_id: studentUserId,
        teacher_user_id: staffUserId,
      })
      .select("id")
      .single();

    if (conversationError) {
      throw conversationError;
    }

    conversationId = conversation.id;
  }

  const { error: messageError } = await supabase.from("messages").insert({
    conversation_id: conversationId,
    message_body: body,
    sender_user_id: senderUserId,
  });

  if (messageError) {
    throw messageError;
  }
};

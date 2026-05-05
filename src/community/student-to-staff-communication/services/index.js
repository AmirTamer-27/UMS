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

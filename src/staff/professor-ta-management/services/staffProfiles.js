import { supabase } from "../../../services/supabase";

export const staffProfileInitialData = {
  staff_number: "",
  title: "",
  office_hours: "",
  bio: "",
};

export const adminStaffInitialData = {
  full_name: "",
  email: "",
  password: "",
  ...staffProfileInitialData,
};

export const getCurrentUser = async () => {
  if (!supabase) {
    throw new Error("Supabase is not configured.");
  }

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error) {
    throw error;
  }

  if (!user) {
    throw new Error("You must be signed in to access this page.");
  }

  return user;
};

export const fetchUserRole = async (userId) => {
  const { data: profile, error } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", userId)
    .single();

  if (error) {
    throw error;
  }

  return profile?.role || "";
};

export const fetchStaffProfile = async (userId) => {
  const { data, error } = await supabase
    .from("staff_profiles")
    .select("*")
    .eq("user_id", userId)
    .single();

  if (error && error.code !== "PGRST116") {
    throw error;
  }

  return data;
};

export const updateStaffProfile = async (userId, formData) => {
  const { error } = await supabase
    .from("staff_profiles")
    .update({
      staff_number: formData.staff_number.trim(),
      title: formData.title.trim(),
      office_hours: formData.office_hours.trim(),
      bio: formData.bio.trim(),
    })
    .eq("user_id", userId);

  if (error) {
    throw error;
  }
};

export const createStaff = async (formData) => {
  const { data, error } = await supabase.functions.invoke("create-staff", {
    body: {
      full_name: formData.full_name.trim(),
      email: formData.email.trim(),
      password: formData.password,
      staff_number: formData.staff_number.trim(),
      title: formData.title.trim(),
      office_hours: formData.office_hours.trim(),
      bio: formData.bio.trim(),
    },
  });

  if (error) {
    if (
      error.name === "FunctionsFetchError" ||
      error.message?.includes("Failed to send a request")
    ) {
      throw new Error(
        'Could not reach the "create-staff" Edge Function. Deploy it to Supabase and verify the project URL/keys.',
      );
    }

    if (error.name === "FunctionsHttpError" && error.context) {
      try {
        const errorBody = await error.context.json();

        if (errorBody?.error) {
          throw new Error(errorBody.error);
        }
      } catch (parseError) {
        if (parseError instanceof Error && parseError.message) {
          throw parseError;
        }
      }
    }

    throw error;
  }

  return data;
};

export const validateStaffForm = (formData, requiredFields) =>
  requiredFields.reduce((errors, field) => {
    if (!formData[field]?.trim()) {
      errors[field] = "This field is required.";
    }

    return errors;
  }, {});

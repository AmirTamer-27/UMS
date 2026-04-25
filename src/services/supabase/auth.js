import { supabase } from "./client";

const requireSupabase = () => {
  if (!supabase) {
    throw new Error(
      "Supabase is not configured. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to your local environment.",
    );
  }

  return supabase;
};

export const authService = {
  signIn: async ({ email, password }) => {
    const client = requireSupabase();
    const { data, error } = await client.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      throw error;
    }

    return data;
  },

  signOut: async () => {
    const client = requireSupabase();
    const { error } = await client.auth.signOut();

    if (error) {
      throw error;
    }
  },

  getSession: async () => {
    const client = requireSupabase();
    const { data, error } = await client.auth.getSession();

    if (error) {
      throw error;
    }

    return data.session;
  },

  getUser: async () => {
    const client = requireSupabase();
    const { data, error } = await client.auth.getUser();

    if (error) {
      throw error;
    }

    return data.user;
  },

  getProfile: async (userId) => {
    if (!userId) {
      return null;
    }

    const client = requireSupabase();
    const { data, error } = await client
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .maybeSingle();

    if (error) {
      throw error;
    }

    return data;
  },
};

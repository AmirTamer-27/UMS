// @ts-ignore
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

declare const Deno: any;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const jsonResponse = (body: Record<string, unknown>, status = 200): Response =>
  new Response(JSON.stringify(body), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
    status,
  });

const normalize = (v: unknown): string | null =>
  typeof v === "string" ? v.trim() || null : null;

Deno.serve(async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return jsonResponse({ error: "Method not allowed" }, 405);
  }

  let createdUserId: string | null = null;

  try {
    const body = await req.json();

    const {
      full_name,
      email,
      password,
      staff_number,
      title,
      office_hours,
      bio,
    } = body as {
      full_name?: string;
      email?: string;
      password?: string;
      staff_number?: string;
      title?: string;
      office_hours?: string;
      bio?: string;
    };

    // Validation
    if (!full_name || !email || !password) {
      return jsonResponse(
        { error: "full_name, email and password are required" },
        400
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !anonKey || !serviceKey) {
      return jsonResponse({ error: "Server configuration error" }, 500);
    }

    const authHeader = req.headers.get("Authorization");

    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader || "" } },
    });

    const admin = createClient(supabaseUrl, serviceKey);

    // Verify requester
    const {
      data: { user },
      error: userError,
    } = await userClient.auth.getUser();

    if (userError || !user) {
      return jsonResponse({ error: "Unauthorized" }, 401);
    }

    // Check admin role
    const { data: profile, error: profileError } = await admin
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profileError || profile?.role !== "admin") {
      return jsonResponse({ error: "Admin only" }, 403);
    }

    // 🔥 Check duplicate in AUTH (not profiles)
    const { data: usersList, error: listError } =
      await admin.auth.admin.listUsers();

    if (listError) {
      return jsonResponse({ error: listError.message }, 500);
    }

    const emailExists = usersList.users.some(
  (u: { email?: string }) => u.email === email
);

    if (emailExists) {
      return jsonResponse({ error: "This email already exists." }, 400);
    }

    // Create auth user
    const { data: createdUser, error: createError } =
      await admin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
      });

    if (createError) {
      if (createError.code === "email_exists") {
        return jsonResponse(
          { error: "This email already exists." },
          400
        );
      }
      return jsonResponse({ error: createError.message }, 400);
    }

    if (!createdUser?.user) {
      throw new Error("User creation failed");
    }

    createdUserId = createdUser.user.id;

    // Insert into profiles
    const { error: insertProfileError } = await admin.from("profiles").insert({
      id: createdUserId,
      full_name,
      email,
      role: "teacher",
      department_id: null,
    });

    if (insertProfileError) {
      throw new Error(insertProfileError.message);
    }

    // Insert into staff_profiles
    const { error: staffError } = await admin
      .from("staff_profiles")
      .insert({
        user_id: createdUserId,
        staff_number: normalize(staff_number),
        title: normalize(title),
        office_hours: normalize(office_hours),
        bio: normalize(bio),
      });

    if (staffError) {
      throw new Error(staffError.message);
    }

    return jsonResponse({
      message: "Staff created successfully",
      user_id: createdUserId,
    });

  } catch (err: unknown) {
    // 🔥 FULL ROLLBACK (CRITICAL FIX)
    if (createdUserId) {
      try {
        const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
        const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
        const admin = createClient(supabaseUrl, serviceKey);

        await admin.auth.admin.deleteUser(createdUserId);
      } catch (rollbackError) {
        console.error("Rollback failed:", rollbackError);
      }
    }

    const message =
      err instanceof Error ? err.message : "Unexpected error";

    return jsonResponse({ error: message }, 500);
  }
});
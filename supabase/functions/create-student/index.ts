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

const normalize = (value: unknown): string | null =>
  typeof value === "string" ? value.trim() || null : null;

const normalizeUuid = (value: unknown): string | null => {
  const normalizedValue = normalize(value);
  return normalizedValue && normalizedValue !== "null" ? normalizedValue : null;
};

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
      student_number,
      department_id,
      level,
      status,
    } = body as {
      full_name?: string;
      email?: string;
      password?: string;
      student_number?: string;
      department_id?: string;
      level?: string;
      status?: string;
    };
    const normalizedDepartmentId = normalizeUuid(department_id);

    if (!full_name || !email || !password || !student_number || !normalizedDepartmentId) {
      return jsonResponse(
        {
          error:
            "full_name, email, password, student_number and department_id are required",
        },
        400,
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

    const {
      data: { user },
      error: userError,
    } = await userClient.auth.getUser();

    if (userError || !user) {
      return jsonResponse({ error: "Unauthorized" }, 401);
    }

    const { data: profile, error: profileError } = await admin
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profileError || profile?.role !== "admin") {
      return jsonResponse({ error: "Admin only" }, 403);
    }

    const { data: usersList, error: listError } =
      await admin.auth.admin.listUsers();

    if (listError) {
      return jsonResponse({ error: listError.message }, 500);
    }

    const normalizedEmail = email.trim();
    const emailExists = usersList.users.some(
      (existingUser: { email?: string }) => existingUser.email === normalizedEmail,
    );

    if (emailExists) {
      return jsonResponse({ error: "This email already exists." }, 400);
    }

    const { data: existingStudent, error: studentNumberError } = await admin
      .from("student_profiles")
      .select("user_id")
      .eq("student_number", student_number.trim())
      .maybeSingle();

    if (studentNumberError) {
      return jsonResponse({ error: studentNumberError.message }, 500);
    }

    if (existingStudent) {
      return jsonResponse({ error: "This student number already exists." }, 400);
    }

    const { data: department, error: departmentError } = await admin
      .from("departments")
      .select("id")
      .eq("id", normalizedDepartmentId)
      .maybeSingle();

    if (departmentError) {
      return jsonResponse({ error: departmentError.message }, 500);
    }

    if (!department) {
      return jsonResponse({ error: "Selected department does not exist." }, 400);
    }

    const { data: createdUser, error: createError } =
      await admin.auth.admin.createUser({
        email: normalizedEmail,
        password,
        email_confirm: true,
      });

    if (createError) {
      if (createError.code === "email_exists") {
        return jsonResponse({ error: "This email already exists." }, 400);
      }

      return jsonResponse({ error: createError.message }, 400);
    }

    if (!createdUser?.user) {
      throw new Error("User creation failed");
    }

    createdUserId = createdUser.user.id;

    const { error: insertProfileError } = await admin.from("profiles").insert({
      id: createdUserId,
      full_name: full_name.trim(),
      email: normalizedEmail,
      role: "student",
      department_id: normalizedDepartmentId,
    });

    if (insertProfileError) {
      throw new Error(insertProfileError.message);
    }

    const { error: studentError } = await admin
      .from("student_profiles")
      .insert({
        user_id: createdUserId,
        student_number: student_number.trim(),
        level: normalize(level),
        status: normalize(status) || "active",
      });

    if (studentError) {
      throw new Error(studentError.message);
    }

    return jsonResponse({
      message: "Student created successfully",
      user_id: createdUserId,
    });
  } catch (err: unknown) {
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

    const message = err instanceof Error ? err.message : "Unexpected error";

    return jsonResponse({ error: message }, 500);
  }
});

import { useEffect, useState } from "react";
import {
  Box,
  Button,
  MenuItem,
  TextField,
  Typography,
  Alert,
} from "@mui/material";
import { supabase } from "../../../services/supabase";

const getProfileName = (profile, fallback = "Unnamed user") =>
  profile?.full_name || profile?.name || profile?.email || fallback;

const ParentMessagesPage = () => {
  const [user, setUser] = useState(null);
  const [students, setStudents] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState("");
  const [teacher, setTeacher] = useState(null);
  const [message, setMessage] = useState("");

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [notice, setNotice] = useState("");

  // get current user
  useEffect(() => {
    const getUser = async () => {
      const { data } = await supabase.auth.getUser();
      setUser(data?.user);
    };

    getUser();
  }, []);

  // load students
  useEffect(() => {
    if (!user) return;

    const loadStudentProfiles = async (studentIds = []) => {
      let query = supabase
        .from("profiles")
        .select("id, full_name, name, email")
        .eq("role", "student")
        .order("full_name");

      if (studentIds.length) {
        query = query.in("id", studentIds);
      }

      const { data: profiles, error: profilesError } = await query;

      if (profilesError) {
        setError(profilesError.message);
        return [];
      }

      return (profiles || []).map((profile) => ({
        student_user_id: profile.id,
        student: profile,
      }));
    };

    const loadStudents = async () => {
      setError("");
      setNotice("");

      const { data, error } = await supabase
        .from("parent_student_links")
        .select(`
          student_user_id,
          student:profiles!parent_student_links_student_user_id_fkey (
            id,
            full_name,
            name,
            email
          )
        `)
        .eq("parent_user_id", user.id);

      if (error) {
        const { data: links, error: linkError } = await supabase
          .from("parent_student_links")
          .select("student_user_id")
          .eq("parent_user_id", user.id);

        if (linkError) {
          setError(linkError.message);
          return;
        }

        const studentIds = (links || [])
          .map((link) => link.student_user_id)
          .filter(Boolean);

        if (!studentIds.length) {
          const fallbackStudents = await loadStudentProfiles();
          setStudents(fallbackStudents);
          if (fallbackStudents.length) {
            setNotice("No linked children were found, so all student profiles are shown.");
          }
          return;
        }

        setStudents(await loadStudentProfiles(studentIds));
        return;
      }

      if (data?.length) {
        setStudents(data);
        return;
      }

      const fallbackStudents = await loadStudentProfiles();
      setStudents(fallbackStudents);
      if (fallbackStudents.length) {
        setNotice("No linked children were found, so all student profiles are shown.");
      }
    };

    loadStudents();
  }, [user]);

  // load teacher (FIXED logic)
  useEffect(() => {
    if (!selectedStudent) return;

    const loadTeacher = async () => {
      setTeacher(null);
      setError("");
      setNotice("");

      const { data: registrations, error: registrationsError } = await supabase
        .from("registrations")
        .select("course_offering_id")
        .eq("student_user_id", selectedStudent)
        .eq("status", "registered");

      if (registrationsError) {
        setError(registrationsError.message);
        return;
      }

      if (!registrations || registrations.length === 0) {
        const { data: fallbackTeacher, error: fallbackError } = await supabase
          .from("profiles")
          .select("id, full_name, name, email")
          .eq("role", "teacher")
          .limit(1);

        if (fallbackError) {
          setError(fallbackError.message);
          return;
        }

        setTeacher(
          fallbackTeacher?.[0]
            ? {
                instructor_user_id: fallbackTeacher[0].id,
                instructor: fallbackTeacher[0],
              }
            : null,
        );
        if (fallbackTeacher?.[0]) {
          setNotice("No registered teacher was found for this student, so the first teacher profile is shown.");
        }
        return;
      }

      const offeringIds = registrations.map((r) => r.course_offering_id);

      const { data, error } = await supabase
        .from("course_offerings")
        .select(`
          instructor_user_id,
          instructor:profiles!course_offerings_instructor_user_id_fkey (
            id,
            full_name,
            name,
            email
          )
        `)
        .in("id", offeringIds)
        .limit(1);

      if (error) {
        setError(error.message);
        return;
      }

      setTeacher(data?.[0] || null);
    };

    loadTeacher();
  }, [selectedStudent]);

  const handleSend = async () => {
    setError("");
    setSuccess("");

    if (!selectedStudent || !teacher || !message) {
      setError("Please fill all fields");
      return;
    }

    const { data: existing } = await supabase
      .from("conversations")
      .select("*")
      .eq("student_user_id", selectedStudent)
      .eq("parent_user_id", user.id)
      .eq("teacher_user_id", teacher.instructor_user_id)
      .maybeSingle();

    let conversationId;

    if (existing) {
      conversationId = existing.id;
    } else {
      const { data: newConv, error } = await supabase
        .from("conversations")
        .insert({
          student_user_id: selectedStudent,
          parent_user_id: user.id,
          teacher_user_id: teacher.instructor_user_id,
        })
        .select()
        .single();

      if (error) {
        setError(error.message);
        return;
      }

      conversationId = newConv.id;
    }

    const { error: msgError } = await supabase.from("messages").insert({
      conversation_id: conversationId,
      sender_user_id: user.id,
      message_body: message,
    });

    if (msgError) {
      setError(msgError.message);
      return;
    }

    setMessage("");
    setSuccess("Message sent successfully");
  };

  return (
    <Box p={3}>
      <Typography variant="h5">Send Message to Teacher</Typography>

      {/* Alerts */}
      {error && (
        <Alert severity="error" sx={{ mt: 2 }}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mt: 2 }}>
          {success}
        </Alert>
      )}

      {notice && (
        <Alert severity="info" sx={{ mt: 2 }}>
          {notice}
        </Alert>
      )}

      {/* Student */}
      <TextField
        select
        fullWidth
        label="Select Student"
        value={selectedStudent}
        onChange={(e) => {
          setSelectedStudent(e.target.value);
          setError("");
        }}
        margin="normal"
      >
        {!students.length ? (
          <MenuItem disabled value="">
            No linked children found
          </MenuItem>
        ) : null}
        {students.map((s) => (
          <MenuItem key={s.student_user_id} value={s.student_user_id}>
            {getProfileName(s.student, s.student_user_id)}
          </MenuItem>
        ))}
      </TextField>

      {/* Teacher */}
      <TextField
        fullWidth
        label="Teacher"
        value={teacher?.instructor ? getProfileName(teacher.instructor) : "No teacher found"}
        margin="normal"
        disabled
      />

      {/* Message */}
      <TextField
        fullWidth
        label="Message"
        multiline
        rows={4}
        value={message}
        onChange={(e) => {
          setMessage(e.target.value);
          setError("");
        }}
        margin="normal"
      />

      <Button variant="contained" onClick={handleSend}>
        Send Message
      </Button>
    </Box>
  );
};

export default ParentMessagesPage;

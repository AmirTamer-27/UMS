import { useEffect, useState } from "react";
import { Alert, Box, Button, MenuItem, TextField, Typography } from "@mui/material";
import { supabase } from "../../../services/supabase";
import { useAuth } from "../../../context/AuthContext";

const ParentMessagesPage = () => {
  const { user } = useAuth();
  const [students, setStudents] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState("");
  const [selectedTeacher, setSelectedTeacher] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loadError, setLoadError] = useState("");
  const [debugInfo, setDebugInfo] = useState(null);

  // Load linked students
  useEffect(() => {
    if (!user) return;

    const loadStudents = async () => {
      setLoadError("");

      const { data: links, error: linksErr } = await supabase
        .from("parent_student_links")
        .select("student_user_id")
        .eq("parent_user_id", user.id);

      if (linksErr) {
        setLoadError(`Links query failed: ${linksErr.message}`);
        return;
      }

      const ids = (links || []).map((l) => l.student_user_id).filter(Boolean);
      setDebugInfo({ userId: user.id, linkCount: links?.length ?? 0, studentIds: ids });

      if (!ids.length) return;

      const { data: profiles, error: profilesErr } = await supabase
        .from("profiles")
        .select("id, full_name")
        .in("id", ids);

      if (profilesErr) {
        setLoadError(`Profiles query failed: ${profilesErr.message}`);
        return;
      }

      setStudents(profiles || []);
    };

    loadStudents();
  }, [user]);

  // Load all teachers/instructors
  useEffect(() => {
    const loadTeachers = async () => {
      const { data, error: err } = await supabase
        .from("profiles")
        .select("id, full_name")
        .in("role", ["teacher", "instructor", "staff"]);

      if (err) {
        console.error("Teachers query failed:", err.message);
        return;
      }

      setTeachers(data || []);
    };

    loadTeachers();
  }, []);

  const handleSend = async () => {
    setError("");
    setSuccess("");

    if (!selectedStudent || !selectedTeacher || !message) {
      setError("Please fill all fields");
      return;
    }

    const { data: existing } = await supabase
      .from("conversations")
      .select("id")
      .eq("student_user_id", selectedStudent)
      .eq("parent_user_id", user.id)
      .eq("teacher_user_id", selectedTeacher)
      .maybeSingle();

    let conversationId = existing?.id;

    if (!conversationId) {
      const { data: newConv, error: convErr } = await supabase
        .from("conversations")
        .insert({
          student_user_id: selectedStudent,
          parent_user_id: user.id,
          teacher_user_id: selectedTeacher,
        })
        .select("id")
        .single();

      if (convErr) {
        setError(convErr.message);
        return;
      }

      conversationId = newConv.id;
    }

    const { error: msgErr } = await supabase.from("messages").insert({
      conversation_id: conversationId,
      sender_user_id: user.id,
      message_body: message,
    });

    if (msgErr) {
      setError(msgErr.message);
      return;
    }

    setMessage("");
    setSuccess("Message sent successfully");
  };

  return (
    <Box p={3}>
      <Typography variant="h5" gutterBottom>
        Send Message to Teacher
      </Typography>

      {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mt: 2 }}>{success}</Alert>}
      {loadError && <Alert severity="error" sx={{ mt: 2 }}>{loadError}</Alert>}
      {debugInfo && students.length === 0 && (
        <Alert severity="info" sx={{ mt: 2 }}>
          Logged in as: <strong>{debugInfo.userId}</strong> —{" "}
          {debugInfo.linkCount === 0
            ? "No parent_student_links rows found for this user ID."
            : `Found ${debugInfo.linkCount} link(s) but profile lookup returned 0 results for IDs: ${debugInfo.studentIds.join(", ")}`}
        </Alert>
      )}

      <TextField
        select
        fullWidth
        label="Select Student"
        value={selectedStudent}
        onChange={(e) => { setSelectedStudent(e.target.value); setError(""); }}
        margin="normal"
      >
        {students.map((s) => (
          <MenuItem key={s.id} value={s.id}>
            {s.full_name}
          </MenuItem>
        ))}
      </TextField>

      <TextField
        select
        fullWidth
        label="Select Teacher"
        value={selectedTeacher}
        onChange={(e) => { setSelectedTeacher(e.target.value); setError(""); }}
        margin="normal"
      >
        {teachers.map((t) => (
          <MenuItem key={t.id} value={t.id}>
            {t.full_name}
          </MenuItem>
        ))}
      </TextField>

      <TextField
        fullWidth
        label="Message"
        multiline
        rows={4}
        value={message}
        onChange={(e) => { setMessage(e.target.value); setError(""); }}
        margin="normal"
      />

      <Button variant="contained" onClick={handleSend}>
        Send Message
      </Button>
    </Box>
  );
};

export default ParentMessagesPage;

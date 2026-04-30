import { useEffect, useState } from "react";
import { Alert, Box, Button, MenuItem, TextField, Typography } from "@mui/material";
import { supabase } from "../../../services/supabase";
import { useAuth } from "../../../context/AuthContext";

const TeacherMessagesPage = () => {
  const { user: currentUser } = useAuth();
  const [students, setStudents] = useState([]);
  const [parents, setParents] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState("");
  const [selectedParent, setSelectedParent] = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [success, setSuccess] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    const loadStudents = async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, full_name")
        .eq("role", "student");

      if (error) {
        console.error(error);
        return;
      }

      setStudents(data || []);
    };

    loadStudents();
  }, []);

  useEffect(() => {
    if (!selectedStudent) {
      setParents([]);
      setSelectedParent("");
      return;
    }

    const loadParents = async () => {
      const { data: links, error: linksErr } = await supabase
        .from("parent_student_links")
        .select("parent_user_id")
        .eq("student_user_id", selectedStudent);

      if (linksErr) {
        console.error(linksErr);
        return;
      }

      const ids = (links || []).map((l) => l.parent_user_id).filter(Boolean);
      if (!ids.length) {
        setParents([]);
        return;
      }

      const { data: profiles, error: profilesErr } = await supabase
        .from("profiles")
        .select("id, full_name")
        .in("id", ids);

      if (profilesErr) {
        console.error(profilesErr);
        return;
      }

      setParents(profiles || []);
    };

    loadParents();
  }, [selectedStudent]);

  const handleSend = async () => {
    if (!currentUser?.id) {
      setErrorMsg("User not authenticated");
      return;
    }
    if (!selectedStudent || !selectedParent || !message) {
      setErrorMsg("Please fill all fields");
      return;
    }

    setSending(true);
    setErrorMsg("");
    setSuccess("");

    try {
      const { data: existing } = await supabase
        .from("conversations")
        .select("id")
        .eq("student_user_id", selectedStudent)
        .eq("teacher_user_id", currentUser.id)
        .eq("parent_user_id", selectedParent)
        .maybeSingle();

      let conversationId = existing?.id;

      if (!conversationId) {
        const { data: newConv, error: convErr } = await supabase
          .from("conversations")
          .insert({
            student_user_id: selectedStudent,
            teacher_user_id: currentUser.id,
            parent_user_id: selectedParent,
          })
          .select("id")
          .single();

        if (convErr) throw convErr;
        conversationId = newConv.id;
      }

      const { error: msgErr } = await supabase.from("messages").insert({
        conversation_id: conversationId,
        sender_user_id: currentUser.id,
        message_body: message,
      });

      if (msgErr) throw msgErr;

      setMessage("");
      setSuccess("Message sent successfully");
    } catch (err) {
      setErrorMsg(err.message || "Failed to send message");
    } finally {
      setSending(false);
    }
  };

  return (
    <Box p={3}>
      <Typography variant="h5" gutterBottom>
        Send Update to Parents
      </Typography>

      {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}
      {errorMsg && <Alert severity="error" sx={{ mb: 2 }}>{errorMsg}</Alert>}

      <TextField
        select
        fullWidth
        label="Select Student"
        value={selectedStudent}
        onChange={(e) => {
          setSelectedStudent(e.target.value);
          setErrorMsg("");
        }}
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
        label="Select Parent"
        value={selectedParent}
        onChange={(e) => {
          setSelectedParent(e.target.value);
          setErrorMsg("");
        }}
        margin="normal"
      >
        {parents.map((p) => (
          <MenuItem key={p.id} value={p.id}>
            {p.full_name}
          </MenuItem>
        ))}
      </TextField>

      <TextField
        fullWidth
        label="Message"
        multiline
        rows={4}
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        margin="normal"
      />

      <Button variant="contained" onClick={handleSend} disabled={sending}>
        {sending ? "Sending..." : "Send Message"}
      </Button>
    </Box>
  );
};

export default TeacherMessagesPage;

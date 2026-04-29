import { useEffect, useState } from "react";
import { Box, Button, MenuItem, TextField, Typography } from "@mui/material";
import { supabase } from "../../../services/supabase";

const TeacherMessagesPage = () => {
  const [students, setStudents] = useState([]);
  const [parents, setParents] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState("");
  const [selectedParent, setSelectedParent] = useState("");
  const [message, setMessage] = useState("");

  // auth user
  const [currentUser, setCurrentUser] = useState(null);

  // UX states
  const [sending, setSending] = useState(false);
  const [success, setSuccess] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  // Load logged-in user
  useEffect(() => {
    const loadUser = async () => {
      const { data } = await supabase.auth.getUser();
      setCurrentUser(data?.user || null);
    };

    loadUser();
  }, []);

  // Load students
  useEffect(() => {
    const loadStudents = async () => {
      const { data } = await supabase
        .from("profiles")
        .select("id, full_name")
        .eq("role", "student");

      setStudents(data || []);
    };

    loadStudents();
  }, []);

  // Load parents based on selected student
  useEffect(() => {
    if (!selectedStudent) return;

    const loadParents = async () => {
      const { data } = await supabase
        .from("parent_student_links")
        .select(`
          parent_user_id,
          parent:profiles!parent_student_links_parent_user_id_fkey (
            id,
            full_name
          )
        `)
        .eq("student_user_id", selectedStudent);

      setParents(data || []);
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
      // find existing conversation
      const { data: existing } = await supabase
        .from("conversations")
        .select("*")
        .eq("student_user_id", selectedStudent)
        .eq("teacher_user_id", currentUser.id)
        .eq("parent_user_id", selectedParent)
        .maybeSingle();

      let conversationId;

      if (existing) {
        conversationId = existing.id;
      } else {
        const { data: newConv, error } = await supabase
          .from("conversations")
          .insert({
            student_user_id: selectedStudent,
            teacher_user_id: currentUser.id,
            parent_user_id: selectedParent,
          })
          .select()
          .single();

        if (error) throw error;

        conversationId = newConv.id;
      }

      // insert message
      const { error: msgError } = await supabase
        .from("messages")
        .insert({
          conversation_id: conversationId,
          sender_user_id: currentUser.id,
          message_body: message,
        });

      if (msgError) throw msgError;

      // success
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

      {/* Success */}
      {success && (
        <Typography color="green" sx={{ mb: 2 }}>
          {success}
        </Typography>
      )}

      {/* Error */}
      {errorMsg && (
        <Typography color="error" sx={{ mb: 2 }}>
          {errorMsg}
        </Typography>
      )}

      {/* Student Select */}
      <TextField
        select
        fullWidth
        label="Select Student"
        value={selectedStudent}
        onChange={(e) => setSelectedStudent(e.target.value)}
        margin="normal"
      >
        {students.map((s) => (
          <MenuItem key={s.id} value={s.id}>
            {s.full_name}
          </MenuItem>
        ))}
      </TextField>

      {/* Parent Select */}
      <TextField
        select
        fullWidth
        label="Select Parent"
        value={selectedParent}
        onChange={(e) => setSelectedParent(e.target.value)}
        margin="normal"
      >
        {parents.map((p) => (
          <MenuItem key={p.parent_user_id} value={p.parent_user_id}>
            {p.parent?.full_name}
          </MenuItem>
        ))}
      </TextField>

      {/* Message */}
      <TextField
        fullWidth
        label="Message"
        multiline
        rows={4}
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        margin="normal"
      />

      {/* Send Button */}
      <Button
        variant="contained"
        onClick={handleSend}
        disabled={sending}
      >
        {sending ? "Sending..." : "Send Message"}
      </Button>
    </Box>
  );
};

export default TeacherMessagesPage;
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

const ParentMessagesPage = () => {
  const [user, setUser] = useState(null);
  const [students, setStudents] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState("");
  const [teacher, setTeacher] = useState(null);
  const [message, setMessage] = useState("");

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

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

    const loadStudents = async () => {
      const { data, error } = await supabase
        .from("parent_student_links")
        .select(`
          student_user_id,
          student:profiles!parent_student_links_student_user_id_fkey (
            id,
            full_name
          )
        `)
        .eq("parent_user_id", user.id);

      if (error) {
        console.error(error);
        return;
      }

      setStudents(data || []);
    };

    loadStudents();
  }, [user]);

  // load teacher (FIXED logic)
  useEffect(() => {
    if (!selectedStudent) return;

    const loadTeacher = async () => {
      const { data: registrations } = await supabase
        .from("registrations")
        .select("course_offering_id")
        .eq("student_user_id", selectedStudent);

      if (!registrations || registrations.length === 0) {
        setTeacher(null);
        return;
      }

      const offeringIds = registrations.map((r) => r.course_offering_id);

      const { data } = await supabase
        .from("course_offerings")
        .select(`
          instructor_user_id,
          instructor:profiles!course_offerings_instructor_user_id_fkey (
            id,
            full_name
          )
        `)
        .in("id", offeringIds)
        .limit(1);

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
        {students.map((s) => (
          <MenuItem key={s.student_user_id} value={s.student_user_id}>
            {s.student?.full_name}
          </MenuItem>
        ))}
      </TextField>

      {/* Teacher */}
      <TextField
        fullWidth
        label="Teacher"
        value={teacher?.instructor?.full_name || "No teacher found"}
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
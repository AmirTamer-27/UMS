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

  // auth user
  const [currentUser, setCurrentUser] = useState(null);

  // UX states
  const [sending, setSending] = useState(false);
  const [success, setSuccess] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [notice, setNotice] = useState("");

  // Load logged-in user
  useEffect(() => {
    const loadUser = async () => {
      const { data } = await supabase.auth.getUser();
      setCurrentUser(data?.user || null);
    };

    loadUser();
  }, []);

  // Load students enrolled in this teacher's course offerings.
  useEffect(() => {
    if (!currentUser?.id) return;

    const loadStudents = async () => {
      setErrorMsg("");
      setNotice("");

      const loadAllStudents = async () => {
        const { data, error } = await supabase
          .from("profiles")
          .select("id, full_name, name, email")
          .eq("role", "student")
          .order("full_name");

        if (error) {
          setErrorMsg(error.message);
          return [];
        }

        return data || [];
      };

      const { data: offerings, error: offeringsError } = await supabase
        .from("course_offerings")
        .select("id")
        .eq("instructor_user_id", currentUser.id);

      if (offeringsError) {
        setErrorMsg(offeringsError.message);
        return;
      }

      const offeringIds = (offerings || []).map((offering) => offering.id);

      if (!offeringIds.length) {
        const fallbackStudents = await loadAllStudents();
        setStudents(fallbackStudents);
        if (fallbackStudents.length) {
          setNotice("No assigned course students were found, so all student profiles are shown.");
        }
        return;
      }

      const { data: registrations, error: registrationsError } = await supabase
        .from("registrations")
        .select("student_user_id")
        .in("course_offering_id", offeringIds)
        .eq("status", "registered");

      if (registrationsError) {
        setErrorMsg(registrationsError.message);
        return;
      }

      const studentIds = [
        ...new Set((registrations || []).map((registration) => registration.student_user_id)),
      ].filter(Boolean);

      if (!studentIds.length) {
        const fallbackStudents = await loadAllStudents();
        setStudents(fallbackStudents);
        if (fallbackStudents.length) {
          setNotice("No registered students were found for your offerings, so all student profiles are shown.");
        }
        return;
      }

      const { data: studentProfiles, error: studentsError } = await supabase
        .from("profiles")
        .select("id, full_name, name, email")
        .in("id", studentIds)
        .order("full_name");

      if (studentsError) {
        setErrorMsg(studentsError.message);
        return;
      }

      setStudents(studentProfiles || []);
    };

    loadStudents();
  }, [currentUser?.id]);

  // Load parents based on selected student
  useEffect(() => {
    if (!selectedStudent) return;

    const loadParents = async () => {
      setSelectedParent("");
      setErrorMsg("");
      setNotice("");

      const { data, error } = await supabase
        .from("parent_student_links")
        .select(`
          parent_user_id,
          parent:profiles!parent_student_links_parent_user_id_fkey (
            id,
            full_name,
            name,
            email
          )
        `)
        .eq("student_user_id", selectedStudent);

      if (error) {
        const { data: fallbackParents, error: fallbackError } = await supabase
          .from("profiles")
          .select("id, full_name, name, email")
          .eq("role", "parent")
          .order("full_name");

        if (fallbackError) {
          setErrorMsg(fallbackError.message);
          return;
        }

        setParents((fallbackParents || []).map((parent) => ({
          parent_user_id: parent.id,
          parent,
        })));
        if (fallbackParents?.length) {
          setNotice("No linked parents were found for this student, so all parent profiles are shown.");
        }
        return;
      }

      if (data?.length) {
        setParents(data);
        return;
      }

      const { data: fallbackParents, error: fallbackError } = await supabase
        .from("profiles")
        .select("id, full_name, name, email")
        .eq("role", "parent")
        .order("full_name");

      if (fallbackError) {
        setErrorMsg(fallbackError.message);
        return;
      }

      setParents((fallbackParents || []).map((parent) => ({
        parent_user_id: parent.id,
        parent,
      })));
      if (fallbackParents?.length) {
        setNotice("No linked parents were found for this student, so all parent profiles are shown.");
      }
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
          setParents([]);
        }}
        margin="normal"
      >
        {!students.length ? (
          <MenuItem disabled value="">
            No registered students found
          </MenuItem>
        ) : null}
        {students.map((s) => (
          <MenuItem key={s.id} value={s.id}>
            {getProfileName(s, s.id)}
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
        {!parents.length ? (
          <MenuItem disabled value="">
            No linked parents found
          </MenuItem>
        ) : null}
        {parents.map((p) => (
          <MenuItem key={p.parent_user_id} value={p.parent_user_id}>
            {getProfileName(p.parent, p.parent_user_id)}
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

      <Button variant="contained" onClick={handleSend} disabled={sending}>
        {sending ? "Sending..." : "Send Message"}
      </Button>
    </Box>
  );
};

export default TeacherMessagesPage;

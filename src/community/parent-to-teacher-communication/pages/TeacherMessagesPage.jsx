import { useEffect, useState } from "react";
import { Box, Button, MenuItem, TextField, Typography } from "@mui/material";
import { supabase } from "../../../services/supabase";

const getProfileName = (profile, fallback = "Unnamed user") =>
  profile?.full_name || profile?.email || fallback;

const TeacherMessagesPage = () => {
  const [students, setStudents] = useState([]);
  const [parents, setParents] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState("");
  const [selectedParent, setSelectedParent] = useState("");
  const [message, setMessage] = useState("");
  const [threadMessages, setThreadMessages] = useState([]);
  const [threadRefreshKey, setThreadRefreshKey] = useState(0);

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
        setStudents([]);
        setNotice("No course offerings are assigned to you yet.");
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
        setStudents([]);
        setNotice("No registered students were found for your course offerings.");
        return;
      }

      const { data: studentProfiles, error: studentsError } = await supabase
        .from("profiles")
        .select("id, full_name, email")
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
      setThreadMessages([]);
      setErrorMsg("");
      setNotice("");

      const { data, error } = await supabase
        .from("parent_student_links")
        .select(`
          parent_user_id,
          parent:profiles!parent_student_links_parent_user_id_fkey (
            id,
            full_name,
            email
          )
        `)
        .eq("student_user_id", selectedStudent);

      if (error) {
        setParents([]);
        setErrorMsg(error.message);
        return;
      }

      if (data?.length) {
        setParents(data);
        return;
      }

      setParents([]);
      setNotice("No linked parents were found for this student.");
    };

    loadParents();
  }, [selectedStudent]);

  useEffect(() => {
    if (!currentUser?.id || !selectedStudent || !selectedParent) {
      setThreadMessages([]);
      return;
    }

    const loadThread = async () => {
      const { data: conversation, error: conversationError } = await supabase
        .from("conversations")
        .select("id")
        .eq("student_user_id", selectedStudent)
        .eq("teacher_user_id", currentUser.id)
        .eq("parent_user_id", selectedParent)
        .maybeSingle();

      if (conversationError) {
        setErrorMsg(conversationError.message);
        return;
      }

      if (!conversation) {
        setThreadMessages([]);
        return;
      }

      const { data: messages, error } = await supabase
        .from("messages")
        .select("*")
        .eq("conversation_id", conversation.id)
        .order("created_at", { ascending: true });

      if (error) {
        setErrorMsg(error.message);
        return;
      }

      setThreadMessages(messages || []);
    };

    loadThread();
  }, [currentUser?.id, selectedStudent, selectedParent, threadRefreshKey]);

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
      setThreadRefreshKey((key) => key + 1);

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

      {notice && (
        <Typography color="text.secondary" sx={{ mb: 2 }}>
          {notice}
        </Typography>
      )}

      {/* Student Select */}
      <TextField
        select
        fullWidth
        label="Select Student"
        value={selectedStudent}
        onChange={(e) => {
          setSelectedStudent(e.target.value);
          setSelectedParent("");
          setParents([]);
          setThreadMessages([]);
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
        onChange={(e) => {
          setSelectedParent(e.target.value);
          setThreadMessages([]);
        }}
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

      {/* Send Button */}
      <Button
        variant="contained"
        onClick={handleSend}
        disabled={sending}
      >
        {sending ? "Sending..." : "Send Message"}
      </Button>

      <Box mt={4}>
        <Typography variant="h6" gutterBottom>
          Conversation Thread
        </Typography>
        {!threadMessages.length ? (
          <Typography color="text.secondary">No messages yet</Typography>
        ) : (
          threadMessages.map((threadMessage) => {
            const isMe = threadMessage.sender_user_id === currentUser?.id;
            const parent = parents.find((item) => item.parent_user_id === selectedParent);

            return (
              <Box key={threadMessage.id} sx={{ borderBottom: "1px solid #ddd", py: 1.5 }}>
                <Typography fontWeight={700}>
                  {isMe ? "You" : getProfileName(parent?.parent, selectedParent)}
                </Typography>
                <Typography>{threadMessage.message_body}</Typography>
                <Typography variant="caption" color="text.secondary">
                  {new Date(threadMessage.created_at).toLocaleString()}
                </Typography>
              </Box>
            );
          })
        )}
      </Box>
    </Box>
  );
};

export default TeacherMessagesPage;

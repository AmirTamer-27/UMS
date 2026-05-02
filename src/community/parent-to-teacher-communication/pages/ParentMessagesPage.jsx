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
  profile?.full_name || profile?.email || fallback;

const ParentMessagesPage = () => {
  const [user, setUser] = useState(null);
  const [students, setStudents] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState("");
  const [teachers, setTeachers] = useState([]);
  const [selectedTeacher, setSelectedTeacher] = useState("");
  const [message, setMessage] = useState("");
  const [threadMessages, setThreadMessages] = useState([]);
  const [threadRefreshKey, setThreadRefreshKey] = useState(0);

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
        .select("id, full_name, email")
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
          setStudents([]);
          setNotice("No linked children were found.");
          return;
        }

        setStudents(await loadStudentProfiles(studentIds));
        return;
      }

      if (data?.length) {
        setStudents(data);
        return;
      }

      setStudents([]);
      setNotice("No linked children were found.");
    };

    loadStudents();
  }, [user]);

  // Load teachers for the student's registered course offerings.
  useEffect(() => {
    if (!selectedStudent) {
      setTeachers([]);
      setSelectedTeacher("");
      return;
    }

    const loadTeachers = async () => {
      setTeachers([]);
      setSelectedTeacher("");
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
        setNotice(
          "No registered courses were visible for this student. Check that the student registration status is registered and that parent RLS can read the student's registrations.",
        );
        return;
      }

      const offeringIds = registrations.map((r) => r.course_offering_id);

      const { data: offerings, error } = await supabase
        .from("course_offerings")
        .select(`
          instructor_user_id,
          instructor:profiles!course_offerings_instructor_user_id_fkey (
            id,
            full_name,
            email
          )
        `)
        .in("id", offeringIds)
        .order("created_at", { ascending: true });

      if (error) {
        setError(error.message);
        return;
      }

      const uniqueTeachers = Array.from(
        new Map(
          (offerings || [])
            .filter((offering) => offering.instructor_user_id && offering.instructor)
            .map((offering) => [offering.instructor_user_id, offering]),
        ).values(),
      );

      setTeachers(uniqueTeachers);
      setSelectedTeacher(uniqueTeachers[0]?.instructor_user_id || "");

      if (!uniqueTeachers.length) {
        setNotice(
          "This student has registered courses, but those course offerings do not have visible instructors assigned.",
        );
      }
    };

    loadTeachers();
  }, [selectedStudent]);

  useEffect(() => {
    if (!user?.id || !selectedStudent || !selectedTeacher) {
      setThreadMessages([]);
      return;
    }

    const loadThread = async () => {
      const { data: conversation, error: conversationError } = await supabase
        .from("conversations")
        .select("id")
        .eq("student_user_id", selectedStudent)
        .eq("parent_user_id", user.id)
        .eq("teacher_user_id", selectedTeacher)
        .maybeSingle();

      if (conversationError) {
        setError(conversationError.message);
        return;
      }

      if (!conversation) {
        setThreadMessages([]);
        return;
      }

      const { data: messages, error: messagesError } = await supabase
        .from("messages")
        .select("*")
        .eq("conversation_id", conversation.id)
        .order("created_at", { ascending: true });

      if (messagesError) {
        setError(messagesError.message);
        return;
      }

      setThreadMessages(messages || []);
    };

    loadThread();
  }, [user?.id, selectedStudent, selectedTeacher, threadRefreshKey]);

  const handleSend = async () => {
    setError("");
    setSuccess("");

    const teacher = teachers.find((item) => item.instructor_user_id === selectedTeacher);

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
    setThreadRefreshKey((key) => key + 1);
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
          setSelectedTeacher("");
          setTeachers([]);
          setThreadMessages([]);
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
        select
        fullWidth
        label="Teacher"
        value={selectedTeacher}
        onChange={(e) => {
          setSelectedTeacher(e.target.value);
          setThreadMessages([]);
          setError("");
        }}
        margin="normal"
        disabled={!teachers.length}
      >
        {!teachers.length ? (
          <MenuItem disabled value="">
            No registered teacher found
          </MenuItem>
        ) : null}
        {teachers.map((item) => (
          <MenuItem key={item.instructor_user_id} value={item.instructor_user_id}>
            {getProfileName(item.instructor, item.instructor_user_id)}
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
        onChange={(e) => {
          setMessage(e.target.value);
          setError("");
        }}
        margin="normal"
      />

      <Button variant="contained" onClick={handleSend}>
        Send Message
      </Button>

      <Box mt={4}>
        <Typography variant="h6" gutterBottom>
          Conversation Thread
        </Typography>
        {!threadMessages.length ? (
          <Typography color="text.secondary">No messages yet</Typography>
        ) : (
          threadMessages.map((threadMessage) => {
            const isMe = threadMessage.sender_user_id === user?.id;
            const teacher = teachers.find((item) => item.instructor_user_id === selectedTeacher);

            return (
              <Box key={threadMessage.id} sx={{ borderBottom: "1px solid #ddd", py: 1.5 }}>
                <Typography fontWeight={700}>
                  {isMe ? "You" : getProfileName(teacher?.instructor, selectedTeacher)}
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

export default ParentMessagesPage;

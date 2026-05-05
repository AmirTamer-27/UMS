import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Container,
  Divider,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import SendOutlinedIcon from "@mui/icons-material/SendOutlined";

import { useAuth } from "../../../context/AuthContext";
import { fetchInstructorStudentRoster } from "../../../staff/professor-ta-management/services";
import {
  fetchConversationMessages,
  fetchStudentInstructors,
  sendStudentStaffMessage,
} from "../services";

const roleAliases = {
  instructor: "staff",
  staff: "staff",
  teacher: "staff",
};

const getDisplayName = (profile, fallback = "Unknown user") =>
  profile?.full_name || profile?.email || fallback;

const StudentStaffMessagesPage = () => {
  const { profile, user } = useAuth();
  const [searchParams] = useSearchParams();
  const [contacts, setContacts] = useState([]);
  const [errorMessage, setErrorMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [notice, setNotice] = useState("");
  const [selectedContactId, setSelectedContactId] = useState("");
  const [sending, setSending] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [threadMessages, setThreadMessages] = useState([]);
  const [threadRefreshKey, setThreadRefreshKey] = useState(0);

  const role = roleAliases[profile?.role] || profile?.role || "student";
  const isStaff = role === "staff";
  const selectedContact = useMemo(
    () => contacts.find((contact) => contact.id === selectedContactId),
    [contacts, selectedContactId],
  );
  const studentUserId = isStaff ? selectedContactId : user?.id;
  const staffUserId = isStaff ? user?.id : selectedContactId;

  useEffect(() => {
    let mounted = true;

    const loadContacts = async () => {
      if (!user?.id) {
        return;
      }

      setLoading(true);
      setErrorMessage("");
      setNotice("");

      try {
        const requestedId = isStaff
          ? searchParams.get("studentId")
          : searchParams.get("staffId");
        let nextContacts = [];

        if (isStaff) {
          const result = await fetchInstructorStudentRoster(user.id);
          nextContacts = result.students;
        } else {
          nextContacts = await fetchStudentInstructors(user.id);
        }

        if (mounted) {
          setContacts(nextContacts);
          setSelectedContactId(
            nextContacts.some((contact) => contact.id === requestedId)
              ? requestedId
              : nextContacts[0]?.id || "",
          );

          if (!nextContacts.length) {
            setNotice(
              isStaff
                ? "No registered students are available to message yet."
                : "No staff members are available to message yet.",
            );
          }
        }
      } catch (error) {
        if (mounted) {
          setContacts([]);
          setSelectedContactId("");
          setErrorMessage(error.message || "Unable to load message contacts.");
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    loadContacts();

    return () => {
      mounted = false;
    };
  }, [isStaff, searchParams, user?.id]);

  useEffect(() => {
    let mounted = true;

    const loadThread = async () => {
      if (!studentUserId || !staffUserId) {
        setThreadMessages([]);
        return;
      }

      setErrorMessage("");

      try {
        const messages = await fetchConversationMessages({
          staffUserId,
          studentUserId,
        });

        if (mounted) {
          setThreadMessages(messages);
        }
      } catch (error) {
        if (mounted) {
          setThreadMessages([]);
          setErrorMessage(error.message || "Unable to load messages.");
        }
      }
    };

    loadThread();

    return () => {
      mounted = false;
    };
  }, [staffUserId, studentUserId, threadRefreshKey]);

  const handleSend = async (event) => {
    event.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");

    if (!selectedContactId || !message.trim()) {
      setErrorMessage("Select a contact and enter a message.");
      return;
    }

    setSending(true);

    try {
      await sendStudentStaffMessage({
        message,
        senderUserId: user.id,
        staffUserId,
        studentUserId,
      });

      setMessage("");
      setSuccessMessage("Message sent successfully.");
      setThreadRefreshKey((key) => key + 1);
    } catch (error) {
      setErrorMessage(error.message || "Unable to send message.");
    } finally {
      setSending(false);
    }
  };

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "background.default", py: 4 }}>
      <Container maxWidth="md">
        <Stack spacing={3}>
          <Box>
            <Typography component="h1" fontWeight={900} variant="h4">
              Student Staff Messages
            </Typography>
            <Typography color="text.secondary">
              {isStaff
                ? "Respond to student inquiries from your roster."
                : "Ask professors and staff questions directly."}
            </Typography>
          </Box>

          {errorMessage ? <Alert severity="error">{errorMessage}</Alert> : null}
          {successMessage ? <Alert severity="success">{successMessage}</Alert> : null}
          {notice ? <Alert severity="info">{notice}</Alert> : null}

          <Card>
            <CardContent sx={{ p: 3 }}>
              <Stack spacing={2.5}>
                <TextField
                  disabled={loading || !contacts.length}
                  fullWidth
                  label={isStaff ? "Select student" : "Select staff member"}
                  onChange={(event) => {
                    setSelectedContactId(event.target.value);
                    setSuccessMessage("");
                  }}
                  select
                  value={selectedContactId}
                >
                  {!contacts.length ? (
                    <MenuItem disabled value="">
                      No contacts available
                    </MenuItem>
                  ) : null}
                  {contacts.map((contact) => (
                    <MenuItem key={contact.id} value={contact.id}>
                      {getDisplayName(contact, contact.id)}
                    </MenuItem>
                  ))}
                </TextField>

                <Card variant="outlined">
                  <CardContent sx={{ p: 0 }}>
                    <Stack
                      divider={<Divider flexItem />}
                      sx={{ maxHeight: 360, overflowY: "auto" }}
                    >
                      {threadMessages.length ? (
                        threadMessages.map((item) => {
                          const isMine = item.sender_user_id === user?.id;

                          return (
                            <Box
                              key={item.id}
                              sx={{
                                bgcolor: isMine ? "action.selected" : "background.paper",
                                p: 2,
                              }}
                            >
                              <Stack spacing={0.5}>
                                <Typography fontWeight={800} variant="body2">
                                  {isMine ? "You" : getDisplayName(selectedContact)}
                                </Typography>
                                <Typography sx={{ whiteSpace: "pre-wrap" }} variant="body2">
                                  {item.message_body}
                                </Typography>
                                <Typography color="text.secondary" variant="caption">
                                  {new Date(item.created_at).toLocaleString()}
                                </Typography>
                              </Stack>
                            </Box>
                          );
                        })
                      ) : (
                        <Box sx={{ p: 2 }}>
                          <Typography color="text.secondary" variant="body2">
                            No messages in this thread yet.
                          </Typography>
                        </Box>
                      )}
                    </Stack>
                  </CardContent>
                </Card>

                <Stack component="form" onSubmit={handleSend} spacing={2}>
                  <TextField
                    disabled={!selectedContactId}
                    fullWidth
                    label="Message"
                    multiline
                    onChange={(event) => setMessage(event.target.value)}
                    rows={4}
                    value={message}
                  />
                  <Stack alignItems="flex-end">
                    <Button
                      disabled={sending || !selectedContactId || !message.trim()}
                      startIcon={<SendOutlinedIcon />}
                      type="submit"
                      variant="contained"
                    >
                      {sending ? "Sending..." : "Send Message"}
                    </Button>
                  </Stack>
                </Stack>
              </Stack>
            </CardContent>
          </Card>
        </Stack>
      </Container>
    </Box>
  );
};

export default StudentStaffMessagesPage;

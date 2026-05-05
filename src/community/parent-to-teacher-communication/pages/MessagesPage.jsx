import { useEffect, useState } from "react";
import { Box, Typography, Paper, Divider } from "@mui/material";
import { supabase } from "../../../services/supabase";
import { useAuth } from "../../../context/AuthContext";

const getProfileName = (profile, fallback = "User") =>
  profile?.full_name || profile?.email || fallback;

const getReceiverId = (message, conversation) => {
  if (!conversation) {
    return null;
  }

  if (message.sender_user_id === conversation.teacher_user_id) {
    return conversation.parent_user_id || conversation.student_user_id;
  }

  if (message.sender_user_id === conversation.parent_user_id) {
    return conversation.teacher_user_id;
  }

  if (message.sender_user_id === conversation.student_user_id) {
    return conversation.teacher_user_id || conversation.parent_user_id;
  }

  return [
    conversation.teacher_user_id,
    conversation.parent_user_id,
    conversation.student_user_id,
  ].find((participantId) => participantId && participantId !== message.sender_user_id);
};

const MessagesPage = () => {
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [profilesMap, setProfilesMap] = useState({});
  const [conversationsMap, setConversationsMap] = useState({});

  useEffect(() => {
    const loadData = async () => {
      const currentUser = user;

      if (!currentUser) return;

      const { data: conversations } = await supabase
        .from("conversations")
        .select("*")
        .or(
          `teacher_user_id.eq.${currentUser.id},parent_user_id.eq.${currentUser.id},student_user_id.eq.${currentUser.id}`,
        );

      if (!conversations || conversations.length === 0) {
        setMessages([]);
        setProfilesMap({});
        setConversationsMap({});
        return;
      }

      const convIds = conversations.map((c) => c.id);

      const convMap = {};
      conversations.forEach((c) => {
        convMap[c.id] = c;
      });
      setConversationsMap(convMap);

      const { data: msgs } = await supabase
        .from("messages")
        .select("*")
        .in("conversation_id", convIds)
        .order("created_at", { ascending: false });

      if (!msgs) return;

      setMessages(msgs);

      const ids = new Set();
      msgs.forEach((m) => ids.add(m.sender_user_id));
      conversations.forEach((c) => {
        ids.add(c.teacher_user_id);
        ids.add(c.parent_user_id);
        ids.add(c.student_user_id);
      });

      const profileIds = Array.from(ids).filter(Boolean);

      if (!profileIds.length) {
        setProfilesMap({});
        return;
      }

      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, full_name, email, role")
        .in("id", profileIds);

      const map = {};
      profiles?.forEach((p) => {
        map[p.id] = p;
      });

      setProfilesMap(map);
    };

    loadData();
  }, [user]);

  return (
    <Box p={3}>
      <Typography variant="h4" fontWeight={900} mb={3} color="primary">
        Inbox
      </Typography>

      <Paper
        sx={{
          borderRadius: 3,
          maxHeight: "70vh",
          overflowY: "auto",
        }}
      >
        {messages.length === 0 ? (
          <Typography p={2}>No messages yet</Typography>
        ) : (
          messages.map((msg, index) => {
            const conv = conversationsMap[msg.conversation_id];
            const receiverId = getReceiverId(msg, conv);
            const sender = profilesMap[msg.sender_user_id];
            const receiver = profilesMap[receiverId];
            const isSender = msg.sender_user_id === user?.id;
            const isReceiver = receiverId === user?.id;
            const senderName = getProfileName(
              sender,
              isSender ? "You" : "User",
            );
            const receiverName = getProfileName(
              receiver,
              isReceiver ? "You" : "User",
            );
            const label = `From ${isSender ? "You" : senderName} to ${
              isReceiver ? "You" : receiverName
            }`;

            return (
              <Box key={msg.id}>
                <Box
                  sx={{
                    px: 2,
                    py: 1.5,
                    transition: "0.2s",
                    "&:hover": {
                      bgcolor: "rgba(0,0,0,0.03)",
                    },
                  }}
                >
                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <Typography
                      variant="subtitle2"
                      fontWeight={700}
                      color="text.primary"
                    >
                      {label}
                    </Typography>

                    <Typography variant="caption" color="text.secondary">
                      {new Date(msg.created_at).toLocaleString()}
                    </Typography>
                  </Box>

                  <Typography
                    variant="body2"
                    sx={{
                      mt: 0.5,
                      color: "text.secondary",
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                  >
                    {msg.message_body}
                  </Typography>
                </Box>

                {index !== messages.length - 1 && (
                  <Divider sx={{ opacity: 0.6 }} />
                )}
              </Box>
            );
          })
        )}
      </Paper>
    </Box>
  );
};

export default MessagesPage;

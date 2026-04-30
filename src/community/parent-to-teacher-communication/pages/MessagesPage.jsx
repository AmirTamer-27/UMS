import { useEffect, useState } from "react";
import { Box, Divider, Paper, Typography } from "@mui/material";
import { supabase } from "../../../services/supabase";
import { useAuth } from "../../../context/AuthContext";

const MessagesPage = () => {
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [profilesMap, setProfilesMap] = useState({});
  const [conversationsMap, setConversationsMap] = useState({});

  useEffect(() => {
    const loadData = async () => {
      const { data: userData } = await supabase.auth.getUser();
      const currentUser = userData?.user;
      setUser(currentUser);

      if (!currentUser) return;

      const { data: conversations } = await supabase
        .from("conversations")
        .select("*")
        .or(`teacher_user_id.eq.${user.id},parent_user_id.eq.${user.id}`);

      if (!conversations || conversations.length === 0) return;

      const convMap = {};
      conversations.forEach((c) => { convMap[c.id] = c; });
      setConversationsMap(convMap);

      const { data: msgs } = await supabase
        .from("messages")
        .select("*")
        .in("conversation_id", conversations.map((c) => c.id))
        .order("created_at", { ascending: false });

      if (!msgs) return;
      setMessages(msgs);

      const ids = new Set();
      msgs.forEach((m) => ids.add(m.sender_user_id));
      conversations.forEach((c) => {
        ids.add(c.teacher_user_id);
        ids.add(c.parent_user_id);
      });

      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, full_name, role")
        .in("id", Array.from(ids));

      const map = {};
      (profiles || []).forEach((p) => { map[p.id] = p; });
      setProfilesMap(map);
    };

    loadData();
  }, [user]);
 

  return (
    <Box p={3}>
      <Typography variant="h4" fontWeight={900} mb={3} color="primary">
        Inbox
      </Typography>

      <Paper sx={{ borderRadius: 3, maxHeight: "70vh", overflowY: "auto" }}>
        {messages.length === 0 ? (
          <Typography p={2}>No messages yet</Typography>
        ) : (
          messages.map((msg, index) => {
            const isMe = msg.sender_user_id === user?.id;
            const conv = conversationsMap[msg.conversation_id];

            let label = "User";

            if (isMe) {
              const receiverId =
                conv?.teacher_user_id === user?.id
                  ? conv?.parent_user_id
                  : conv?.teacher_user_id;

              const receiver = profilesMap[receiverId];
              label = `Sent to ${receiver?.full_name || "User"}`;
            } else {
              const sender = profilesMap[msg.sender_user_id];
              label = `${sender?.full_name || "User"} → You`;
            }

            return (
              <Box key={msg.id}>
                <Box
                  sx={{
                    px: 2,
                    py: 1.5,
                    "&:hover": { bgcolor: "rgba(0,0,0,0.03)" },
                  }}
                >
                  <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <Typography variant="subtitle2" fontWeight={700} color="text.primary">
                      {label}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {new Date(msg.created_at).toLocaleString()}
                    </Typography>
                  </Box>

                  {/* Message */}
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

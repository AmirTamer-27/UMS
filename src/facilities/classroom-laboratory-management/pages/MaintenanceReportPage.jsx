import { useEffect, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Container,
  MenuItem,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";

import MainLayout from "../../../shared/components/layout/MainLayout";
import { useAuth } from "../../../context/AuthContext";
import { supabase } from "../../../services/supabase";

export default function MaintenanceReportPage() {
  const { profile, user } = useAuth();

  const [rooms, setRooms] = useState([]);
  const [message, setMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const [form, setForm] = useState({
    room_id: "",
    issue_description: "",
  });

  useEffect(() => {
    loadRooms();
  }, []);

  const loadRooms = async () => {
    const { data, error } = await supabase
      .from("rooms")
      .select("id, name, room_type, building")
      .order("name");

    if (error) setErrorMessage(error.message);
    else setRooms(data || []);
  };

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");
    setErrorMessage("");

    const { error } = await supabase.from("maintenance_reports").insert([
      {
        room_id: form.room_id,
        reported_by_user_id: user?.id,
        issue_description: form.issue_description,
        status: "pending",
        created_at: new Date().toISOString(),
      },
    ]);

    if (error) {
      setErrorMessage(error.message);
      return;
    }

    setMessage("Maintenance issue submitted successfully for admin review.");
    setForm({ room_id: "", issue_description: "" });
  };

  return (
    <MainLayout profile={profile}>
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Stack spacing={3}>
          <Box>
            <Typography variant="h4" fontWeight="900">
              Report Maintenance Issue
            </Typography>
            <Typography color="text.secondary">
              Select the affected room or lab and describe the issue.
            </Typography>
          </Box>

          {message && <Alert severity="success">{message}</Alert>}
          {errorMessage && <Alert severity="error">{errorMessage}</Alert>}

          <Paper sx={{ p: 3 }}>
            <Stack component="form" spacing={2} onSubmit={handleSubmit}>
              <TextField
                select
                label="Affected Room / Lab"
                name="room_id"
                value={form.room_id}
                onChange={handleChange}
                required
              >
                {rooms.map((room) => (
                  <MenuItem key={room.id} value={room.id}>
                    {room.name} — {room.room_type} — {room.building || "No building"}
                  </MenuItem>
                ))}
              </TextField>

              <TextField
                label="Issue Description"
                name="issue_description"
                value={form.issue_description}
                onChange={handleChange}
                multiline
                rows={5}
                required
              />

              <Button type="submit" variant="contained">
                Submit Issue
              </Button>
            </Stack>
          </Paper>
        </Stack>
      </Container>
    </MainLayout>
  );
}
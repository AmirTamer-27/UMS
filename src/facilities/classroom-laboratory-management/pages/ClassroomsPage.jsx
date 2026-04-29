import { useEffect, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Chip,
  Container,
  MenuItem,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";

import { supabase } from "../../../lib/supabaseClient";

export default function ClassroomsPage() {
  const [rooms, setRooms] = useState([]);
  const [form, setForm] = useState({
    room_id: "",
    booking_date: "",
    start_time: "",
    end_time: "",
    purpose: "",
  });
  const [message, setMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    fetchRooms();
  }, []);

  const fetchRooms = async () => {
    const { data, error } = await supabase
      .from("rooms")
      .select("id, name, room_type, capacity, building, is_active")
      .eq("is_active", true)
      .order("name");

    if (error) setErrorMessage(error.message);
    else setRooms(data || []);
  };

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleBooking = async (e) => {
    e.preventDefault();
    setMessage("");
    setErrorMessage("");

    const { data: conflicts, error: conflictError } = await supabase
      .from("room_bookings")
      .select("id")
      .eq("room_id", form.room_id)
      .eq("booking_date", form.booking_date)
      .lt("start_time", form.end_time)
      .gt("end_time", form.start_time);

    if (conflictError) {
      setErrorMessage(conflictError.message);
      return;
    }

    if (conflicts.length > 0) {
      setErrorMessage("This room is already booked at the selected time.");
      return;
    }

    const { error } = await supabase.from("room_bookings").insert([
      {
        room_id: form.room_id,
        booking_date: form.booking_date,
        start_time: form.start_time,
        end_time: form.end_time,
        purpose: form.purpose,
        status: "reserved",
      },
    ]);

    if (error) setErrorMessage(error.message);
    else {
      setMessage("Room booked successfully.");
      setForm({
        room_id: "",
        booking_date: "",
        start_time: "",
        end_time: "",
        purpose: "",
      });
    }
  };

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "background.default", py: 4 }}>
      <Container maxWidth="lg">
        <Stack spacing={3}>
          <Box>
            <Typography variant="h4" fontWeight="bold">
              Classrooms
            </Typography>
            <Typography color="text.secondary">
              View available classrooms and book a room.
            </Typography>
          </Box>

          {message && <Alert severity="success">{message}</Alert>}
          {errorMessage && <Alert severity="error">{errorMessage}</Alert>}

          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" fontWeight="bold" sx={{ mb: 2 }}>
              Book Classroom
            </Typography>

            <Stack component="form" spacing={2} onSubmit={handleBooking}>
              <TextField
                select
                label="Room"
                name="room_id"
                value={form.room_id}
                onChange={handleChange}
                required
              >
                {rooms.map((room) => (
                  <MenuItem key={room.id} value={room.id}>
                    {room.name} - {room.building}
                  </MenuItem>
                ))}
              </TextField>

              <TextField
                type="date"
                label="Booking Date"
                name="booking_date"
                value={form.booking_date}
                onChange={handleChange}
                InputLabelProps={{ shrink: true }}
                required
              />

              <TextField
                type="time"
                label="Start Time"
                name="start_time"
                value={form.start_time}
                onChange={handleChange}
                InputLabelProps={{ shrink: true }}
                required
              />

              <TextField
                type="time"
                label="End Time"
                name="end_time"
                value={form.end_time}
                onChange={handleChange}
                InputLabelProps={{ shrink: true }}
                required
              />

              <TextField
                label="Purpose"
                name="purpose"
                value={form.purpose}
                onChange={handleChange}
              />

              <Button type="submit" variant="contained">
                Book Classroom
              </Button>
            </Stack>
          </Paper>

          <Paper sx={{ overflow: "hidden" }}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Room Name</TableCell>
                  <TableCell>Type</TableCell>
                  <TableCell>Capacity</TableCell>
                  <TableCell>Building</TableCell>
                  <TableCell>Status</TableCell>
                </TableRow>
              </TableHead>

              <TableBody>
                {rooms.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5}>No classrooms found.</TableCell>
                  </TableRow>
                ) : (
                  rooms.map((room) => (
                    <TableRow key={room.id}>
                      <TableCell>{room.name}</TableCell>
                      <TableCell>{room.room_type}</TableCell>
                      <TableCell>{room.capacity}</TableCell>
                      <TableCell>{room.building || "-"}</TableCell>
                      <TableCell>
                        <Chip label="Available" color="success" size="small" />
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </Paper>
        </Stack>
      </Container>
    </Box>
  );
}
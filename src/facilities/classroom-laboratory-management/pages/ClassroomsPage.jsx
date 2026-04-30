import { useEffect, useMemo, useState } from "react";
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

import { useAuth } from "../../../context/AuthContext";
import { supabase } from "../../../lib/supabaseClient";

const daySlots = [
  { start_time: "08:00", end_time: "09:00" },
  { start_time: "09:00", end_time: "10:00" },
  { start_time: "10:00", end_time: "11:00" },
  { start_time: "11:00", end_time: "12:00" },
  { start_time: "12:00", end_time: "13:00" },
  { start_time: "13:00", end_time: "14:00" },
  { start_time: "14:00", end_time: "15:00" },
  { start_time: "15:00", end_time: "16:00" },
  { start_time: "16:00", end_time: "17:00" },
  { start_time: "17:00", end_time: "18:00" },
];

const normalizeTime = (value) => value?.slice(0, 5) || "";

const timeOverlaps = (slot, booking) =>
  slot.start_time < normalizeTime(booking.end_time) &&
  slot.end_time > normalizeTime(booking.start_time);

export default function ClassroomsPage() {
  const { user } = useAuth();
  const [rooms, setRooms] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [loadingBookings, setLoadingBookings] = useState(false);
  const [form, setForm] = useState({
    room_id: "",
    booking_date: "",
    start_time: "",
    end_time: "",
    purpose: "",
  });
  const [filters, setFilters] = useState({
    start_time: "",
    end_time: "",
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

  useEffect(() => {
    const fetchBookings = async () => {
      if (!form.room_id || !form.booking_date) {
        setBookings([]);
        return;
      }

      setLoadingBookings(true);
      setErrorMessage("");

      const { data, error } = await supabase
        .from("room_bookings")
        .select("id, start_time, end_time, purpose, status")
        .eq("room_id", form.room_id)
        .eq("booking_date", form.booking_date)
        .eq("status", "confirmed")
        .order("start_time");

      if (error) {
        setErrorMessage(error.message);
        setBookings([]);
      } else {
        setBookings(data || []);
      }

      setLoadingBookings(false);
    };

    fetchBookings();
  }, [form.booking_date, form.room_id]);

  const visibleSlots = useMemo(
    () =>
      daySlots
        .filter((slot) => !filters.start_time || slot.end_time > filters.start_time)
        .filter((slot) => !filters.end_time || slot.start_time < filters.end_time)
        .map((slot) => {
          const booking = bookings.find((currentBooking) =>
            timeOverlaps(slot, currentBooking),
          );

          return {
            ...slot,
            booking,
            isBooked: Boolean(booking),
            isSelected:
              form.start_time === slot.start_time && form.end_time === slot.end_time,
          };
        }),
    [bookings, filters.end_time, filters.start_time, form.end_time, form.start_time],
  );

  const handleChange = (e) => {
    const { name, value } = e.target;

    setForm((currentForm) => ({
      ...currentForm,
      [name]: value,
      ...(name === "room_id" || name === "booking_date"
        ? { start_time: "", end_time: "" }
        : {}),
    }));
  };

  const handleFilterChange = (e) => {
    setFilters({ ...filters, [e.target.name]: e.target.value });
  };

  const handleSelectSlot = (slot) => {
    if (slot.isBooked) return;

    setForm((currentForm) => ({
      ...currentForm,
      start_time: slot.start_time,
      end_time: slot.end_time,
    }));
  };

  const handleBooking = async (e) => {
    e.preventDefault();
    setMessage("");
    setErrorMessage("");

    if (!user?.id) {
      setErrorMessage("You must be logged in to book a room.");
      return;
    }

    if (!form.start_time || !form.end_time) {
      setErrorMessage("Select an available time slot before booking.");
      return;
    }

    const { data: conflicts, error: conflictError } = await supabase
      .from("room_bookings")
      .select("id")
      .eq("room_id", form.room_id)
      .eq("booking_date", form.booking_date)
      .eq("status", "confirmed")
      .lt("start_time", form.end_time)
      .gt("end_time", form.start_time);

    if (conflictError) {
      setErrorMessage(conflictError.message);
      return;
    }

    if (conflicts?.length > 0) {
      setErrorMessage("This room is already booked at the selected time.");
      return;
    }

    const { data: booking, error } = await supabase
      .from("room_bookings")
      .insert([
        {
          room_id: form.room_id,
          booked_by_user_id: user.id,
          booking_date: form.booking_date,
          start_time: form.start_time,
          end_time: form.end_time,
          purpose: form.purpose,
          status: "confirmed",
        },
      ])
      .select("id, start_time, end_time, purpose, status")
      .single();

    if (error) setErrorMessage(error.message);
    else {
      setMessage("Room booked successfully.");
      setBookings((currentBookings) => [...currentBookings, booking]);
      setForm({
        ...form,
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

              <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
                <TextField
                  type="time"
                  label="Filter From"
                  name="start_time"
                  value={filters.start_time}
                  onChange={handleFilterChange}
                  InputLabelProps={{ shrink: true }}
                  fullWidth
                />

                <TextField
                  type="time"
                  label="Filter To"
                  name="end_time"
                  value={filters.end_time}
                  onChange={handleFilterChange}
                  InputLabelProps={{ shrink: true }}
                  fullWidth
                />
              </Stack>

              <Paper variant="outlined" sx={{ p: 2 }}>
                <Stack spacing={1.5}>
                  <Stack
                    direction={{ xs: "column", sm: "row" }}
                    justifyContent="space-between"
                    spacing={1}
                  >
                    <Typography fontWeight="bold">Available Time Slots</Typography>
                    {form.start_time && form.end_time ? (
                      <Chip
                        color="primary"
                        label={`Selected ${form.start_time} - ${form.end_time}`}
                        size="small"
                      />
                    ) : null}
                  </Stack>

                  {!form.room_id || !form.booking_date ? (
                    <Alert severity="info">
                      Select a room and date to view available slots.
                    </Alert>
                  ) : loadingBookings ? (
                    <Typography color="text.secondary">Loading room bookings...</Typography>
                  ) : visibleSlots.length === 0 ? (
                    <Alert severity="warning">
                      No slots match the selected time filter.
                    </Alert>
                  ) : (
                    <Stack direction="row" flexWrap="wrap" gap={1}>
                      {visibleSlots.map((slot) => (
                        <Button
                          key={`${slot.start_time}-${slot.end_time}`}
                          color={
                            slot.isBooked
                              ? "error"
                              : slot.isSelected
                                ? "primary"
                                : "success"
                          }
                          disabled={slot.isBooked}
                          onClick={() => handleSelectSlot(slot)}
                          size="small"
                          variant={slot.isSelected || slot.isBooked ? "contained" : "outlined"}
                          sx={{ minWidth: 132 }}
                        >
                          {slot.start_time} - {slot.end_time}
                        </Button>
                      ))}
                    </Stack>
                  )}

                  {bookings.length > 0 ? (
                    <Stack direction="row" flexWrap="wrap" gap={1}>
                      {bookings.map((booking) => (
                        <Chip
                          key={booking.id}
                          color="error"
                          label={`Booked ${normalizeTime(booking.start_time)} - ${normalizeTime(
                            booking.end_time,
                          )}`}
                          size="small"
                          variant="outlined"
                        />
                      ))}
                    </Stack>
                  ) : null}
                </Stack>
              </Paper>

              <TextField
                label="Purpose"
                name="purpose"
                value={form.purpose}
                onChange={handleChange}
              />

              <Button
                disabled={!form.room_id || !form.booking_date || !form.start_time}
                type="submit"
                variant="contained"
              >
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

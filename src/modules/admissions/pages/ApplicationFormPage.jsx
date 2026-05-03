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
import { useNavigate } from "react-router-dom";

import { supabase } from "../../../lib/supabaseClient";

const initialForm = {
  full_name: "",
  email: "",
  phone: "",
  date_of_birth: "",
  department_id: "",
  gpa: "",
  personal_statement: "",
};

export default function ApplicationFormPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState(initialForm);
  const [departments, setDepartments] = useState([]);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    supabase
      .from("departments")
      .select("id, name, code")
      .order("name")
      .then(({ data, error }) => {
        if (!error) setDepartments(data || []);
      });
  }, []);

  const validate = () => {
    const newErrors = {};
    if (!form.full_name.trim()) newErrors.full_name = "Full name is required.";
    if (!form.email.trim()) newErrors.email = "Email is required.";
    else if (!/\S+@\S+\.\S+/.test(form.email)) newErrors.email = "Enter a valid email.";
    if (!form.department_id) newErrors.department_id = "Please select a department.";
    if (form.gpa && (isNaN(Number(form.gpa)) || Number(form.gpa) < 0 || Number(form.gpa) > 4))
      newErrors.gpa = "GPA must be a number between 0 and 4.";
    return newErrors;
  };

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    if (errors[e.target.name]) setErrors({ ...errors, [e.target.name]: undefined });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage("");

    const validationErrors = validate();
    if (Object.keys(validationErrors).length) {
      setErrors(validationErrors);
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        full_name: form.full_name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim() || null,
        date_of_birth: form.date_of_birth || null,
        department_id: form.department_id,
        gpa: form.gpa ? Number(form.gpa) : null,
        personal_statement: form.personal_statement.trim() || null,
      };

      const { error } = await supabase.from("admission_applications").insert(payload);

      if (error) {
        setErrorMessage(error.message);
        return;
      }

      setSubmitted(true);
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <Box sx={{ minHeight: "100vh", bgcolor: "background.default", py: 8 }}>
        <Container maxWidth="sm">
          <Paper sx={{ p: 5, textAlign: "center" }}>
            <Typography variant="h5" fontWeight="bold" gutterBottom>
              Application Submitted
            </Typography>
            <Typography color="text.secondary" sx={{ mb: 3 }}>
              Thank you for applying. Your application has been received and is
              pending review. We will contact you at <strong>{form.email}</strong> with
              a decision.
            </Typography>
            <Stack spacing={2}>
              <Button variant="contained" onClick={() => { setForm(initialForm); setSubmitted(false); }}>
                Submit Another Application
              </Button>
              <Button variant="outlined" onClick={() => navigate("/login")}>
                Back to Login
              </Button>
            </Stack>
          </Paper>
        </Container>
      </Box>
    );
  }

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "background.default", py: 6 }}>
      <Container maxWidth="sm">
        <Stack spacing={3}>
          <Box>
            <Button
              size="small"
              variant="text"
              onClick={() => navigate("/login")}
              sx={{ mb: 1, pl: 0 }}
            >
              ← Back to Login
            </Button>
            <Typography variant="h4" fontWeight="bold">
              Admission Application
            </Typography>
            <Typography color="text.secondary">
              Fill in the form below to apply for admission to the university.
            </Typography>
          </Box>

          {errorMessage && <Alert severity="error">{errorMessage}</Alert>}

          <Paper sx={{ p: 4 }}>
            <Stack component="form" spacing={2} onSubmit={handleSubmit}>
              <TextField
                label="Full Name"
                name="full_name"
                value={form.full_name}
                onChange={handleChange}
                error={Boolean(errors.full_name)}
                helperText={errors.full_name}
                required
              />
              <TextField
                label="Email Address"
                name="email"
                type="email"
                value={form.email}
                onChange={handleChange}
                error={Boolean(errors.email)}
                helperText={errors.email}
                required
              />
              <TextField
                label="Phone Number"
                name="phone"
                value={form.phone}
                onChange={handleChange}
              />
              <TextField
                label="Date of Birth"
                name="date_of_birth"
                type="date"
                value={form.date_of_birth}
                onChange={handleChange}
                InputLabelProps={{ shrink: true }}
              />
              <TextField
                select
                label="Desired Department"
                name="department_id"
                value={form.department_id}
                onChange={handleChange}
                error={Boolean(errors.department_id)}
                helperText={errors.department_id}
                required
              >
                {departments.map((dept) => (
                  <MenuItem key={dept.id} value={dept.id}>
                    {dept.name} ({dept.code})
                  </MenuItem>
                ))}
              </TextField>
              <TextField
                label="GPA (0 – 4)"
                name="gpa"
                value={form.gpa}
                onChange={handleChange}
                error={Boolean(errors.gpa)}
                helperText={errors.gpa}
                inputProps={{ step: "0.01" }}
              />
              <TextField
                label="Personal Statement"
                name="personal_statement"
                value={form.personal_statement}
                onChange={handleChange}
                multiline
                rows={5}
                placeholder="Tell us about yourself, your goals, and why you want to join this university."
              />

              <Button
                type="submit"
                variant="contained"
                size="large"
                disabled={submitting}
              >
                {submitting ? "Submitting…" : "Submit Application"}
              </Button>
            </Stack>
          </Paper>
        </Stack>
      </Container>
    </Box>
  );
}

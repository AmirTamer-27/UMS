import { useEffect, useMemo, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";

import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import CircularProgress from "@mui/material/CircularProgress";
import Container from "@mui/material/Container";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";

import { useAuth } from "../../../context/AuthContext";
import MainLayout from "../../../shared/components/layout/MainLayout";
import { supabase } from "../../../services/supabase";

const getStaffProfile = (staffProfiles) => {
  if (Array.isArray(staffProfiles)) {
    return staffProfiles[0] || null;
  }

  return staffProfiles || null;
};

const EditStaffProfile = () => {
  const navigate = useNavigate();
  const { profile, refreshProfile, user } = useAuth();
  const [email, setEmail] = useState("");
  const [officeHours, setOfficeHours] = useState("");
  const [title, setTitle] = useState("");
  const [bio, setBio] = useState("");
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState({ message: "", severity: "success" });

  const canEditProfile = profile?.role === "teacher" || profile?.role === "staff";
  const layoutProfile = useMemo(
    () => ({
      ...profile,
      name: profile?.name || profile?.full_name || user?.email || "Staff User",
    }),
    [profile, user?.email],
  );

  useEffect(() => {
    let mounted = true;

    const loadProfile = async () => {
      if (!user?.id || !canEditProfile) {
        setLoading(false);
        return;
      }

      setLoading(true);
      setFeedback({ message: "", severity: "success" });

      const { data, error } = await supabase
        .from("profiles")
        .select(
          `
            id,
            email,
            staff_profiles (
              office_hours,
              title,
              bio
            )
          `,
        )
        .eq("id", user.id)
        .single();

      if (!mounted) {
        return;
      }

      if (error) {
        setFeedback({
          message: error.message || "Unable to load your profile.",
          severity: "error",
        });
      } else {
        const staffProfile = getStaffProfile(data?.staff_profiles);
        setEmail(data?.email || "");
        setOfficeHours(staffProfile?.office_hours || "");
        setTitle(staffProfile?.title || "");
        setBio(staffProfile?.bio || "");
      }

      setLoading(false);
    };

    loadProfile();

    return () => {
      mounted = false;
    };
  }, [canEditProfile, user?.id]);

  const validateForm = () => {
    const nextErrors = {};

    if (!email.trim()) {
      nextErrors.email = "Email is required.";
    }

    if (!officeHours.trim()) {
      nextErrors.officeHours = "Office hours are required.";
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setFeedback({ message: "", severity: "success" });

    if (!validateForm()) {
      return;
    }

    setSaving(true);

    try {
      const nextEmail = email.trim();
      const nextOfficeHours = officeHours.trim();
      const nextTitle = title.trim();
      const nextBio = bio.trim();

      const { error: profileError } = await supabase
        .from("profiles")
        .update({ email: nextEmail })
        .eq("id", user.id);

      if (profileError) {
        throw profileError;
      }

      const { data: updatedStaffProfile, error: staffProfileError } = await supabase
        .from("staff_profiles")
        .update({
          bio: nextBio,
          office_hours: nextOfficeHours,
          title: nextTitle,
        })
        .eq("user_id", user.id)
        .select("bio, office_hours, title")
        .maybeSingle();

      if (staffProfileError) {
        throw staffProfileError;
      }

      if (!updatedStaffProfile) {
        throw new Error(
          "No staff profile row was updated. Please ask an administrator to create your staff profile.",
        );
      }

      setEmail(nextEmail);
      setOfficeHours(updatedStaffProfile.office_hours || "");
      setTitle(updatedStaffProfile.title || "");
      setBio(updatedStaffProfile.bio || "");
      await refreshProfile();
      setFeedback({
        message: "Profile updated successfully.",
        severity: "success",
      });
    } catch (error) {
      setFeedback({
        message: error.message || "Unable to update your profile.",
        severity: "error",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    navigate("/dashboard");
  };

  if (!canEditProfile) {
    return <Navigate replace to="/dashboard" />;
  }

  return (
    <MainLayout profile={layoutProfile}>
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Paper
          elevation={0}
          sx={{
            border: 1,
            borderColor: "divider",
            borderRadius: 2,
            p: { xs: 3, sm: 4 },
          }}
        >
          <Stack spacing={3}>
            <Box>
              <Typography color="primary" component="h1" fontWeight={900} variant="h4">
                Edit Profile
              </Typography>
              <Typography color="text.secondary" sx={{ mt: 1 }}>
                Update your contact email and office hours for students.
              </Typography>
            </Box>

            {feedback.message ? (
              <Alert severity={feedback.severity}>{feedback.message}</Alert>
            ) : null}

            {loading ? (
              <Box
                sx={{
                  alignItems: "center",
                  display: "flex",
                  justifyContent: "center",
                  minHeight: 220,
                }}
              >
                <CircularProgress />
              </Box>
            ) : (
              <Stack component="form" onSubmit={handleSubmit} spacing={2.5}>
                <TextField
                  disabled={saving}
                  error={Boolean(errors.email)}
                  fullWidth
                  helperText={errors.email}
                  label="Email"
                  onChange={(event) => {
                    setEmail(event.target.value);
                    setErrors((currentErrors) => ({ ...currentErrors, email: "" }));
                  }}
                  required
                  type="email"
                  value={email}
                />

                <TextField
                  disabled={saving}
                  error={Boolean(errors.officeHours)}
                  fullWidth
                  helperText={errors.officeHours}
                  label="Office Hours"
                  multiline
                  onChange={(event) => {
                    setOfficeHours(event.target.value);
                    setErrors((currentErrors) => ({
                      ...currentErrors,
                      officeHours: "",
                    }));
                  }}
                  required
                  rows={4}
                  value={officeHours}
                />

                <TextField
                  disabled={saving}
                  fullWidth
                  label="Title"
                  onChange={(event) => setTitle(event.target.value)}
                  value={title}
                />

                <TextField
                  disabled={saving}
                  fullWidth
                  label="Bio"
                  multiline
                  onChange={(event) => setBio(event.target.value)}
                  rows={4}
                  value={bio}
                />

                <Stack direction={{ xs: "column", sm: "row" }} justifyContent="flex-end" spacing={1.5}>
                  <Button disabled={saving} onClick={handleCancel} variant="outlined">
                    Cancel
                  </Button>
                  <Button disabled={saving} type="submit" variant="contained">
                    {saving ? "Saving..." : "Save"}
                  </Button>
                </Stack>
              </Stack>
            )}
          </Stack>
        </Paper>
      </Container>
    </MainLayout>
  );
};

export default EditStaffProfile;

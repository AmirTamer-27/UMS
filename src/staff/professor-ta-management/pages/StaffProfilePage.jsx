import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";

import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import CircularProgress from "@mui/material/CircularProgress";
import Container from "@mui/material/Container";
import Paper from "@mui/material/Paper";
import Snackbar from "@mui/material/Snackbar";
import Typography from "@mui/material/Typography";

import { StaffForm } from "../components";
import {
  fetchStaffProfile,
  fetchUserRole,
  getCurrentUser,
  staffProfileInitialData,
  updateStaffProfile,
  validateStaffForm,
} from "../services";

const requiredFields = ["staff_number", "title", "office_hours"];

const StaffProfilePage = () => {
  const [userId, setUserId] = useState("");
  const [formData, setFormData] = useState(staffProfileInitialData);
  const [fieldErrors, setFieldErrors] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hasStaffProfile, setHasStaffProfile] = useState(false);
  const [isTeacher, setIsTeacher] = useState(false);
  const [accessChecked, setAccessChecked] = useState(false);
  const [snackbar, setSnackbar] = useState({
    message: "",
    severity: "success",
    open: false,
  });

  useEffect(() => {
    let isMounted = true;

    const loadStaffProfile = async () => {
      setLoading(true);

      try {
        const user = await getCurrentUser();
        const [role, profile] = await Promise.all([
          fetchUserRole(user.id),
          fetchStaffProfile(user.id),
        ]);

        if (!isMounted) {
          return;
        }

        setUserId(user.id);
        setIsTeacher(role === "teacher");
        setAccessChecked(true);

        if (profile) {
          setFormData({
            staff_number: profile.staff_number ?? "",
            title: profile.title ?? "",
            office_hours: profile.office_hours ?? "",
            bio: profile.bio ?? "",
          });
          setHasStaffProfile(true);
        }
      } catch (error) {
        if (isMounted) {
          setAccessChecked(true);
          setSnackbar({
            message: error.message || "Unable to load staff profile.",
            severity: "error",
            open: true,
          });
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadStaffProfile();

    return () => {
      isMounted = false;
    };
  }, []);

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((currentData) => ({
      ...currentData,
      [name]: value,
    }));

    if (fieldErrors[name]) {
      setFieldErrors((currentErrors) => ({
        ...currentErrors,
        [name]: "",
      }));
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!hasStaffProfile) {
      setSnackbar({
        message: "Your profile has not been created yet. Please contact an administrator.",
        severity: "warning",
        open: true,
      });
      return;
    }

    const validationErrors = validateStaffForm(formData, requiredFields);
    setFieldErrors(validationErrors);

    if (Object.keys(validationErrors).length > 0) {
      return;
    }

    setSaving(true);

    try {
      await updateStaffProfile(userId, formData);
      setSnackbar({
        message: "Staff profile updated successfully.",
        severity: "success",
        open: true,
      });
    } catch (error) {
      setSnackbar({
        message: error.message || "Unable to update staff profile.",
        severity: "error",
        open: true,
      });
    } finally {
      setSaving(false);
    }
  };

  const handleCloseSnackbar = () => {
    setSnackbar((currentSnackbar) => ({
      ...currentSnackbar,
      open: false,
    }));
  };

  if (!loading && accessChecked && !isTeacher) {
    return <Navigate replace to="/dashboard" />;
  }

  const formDisabled = loading || saving || !userId || !hasStaffProfile;

  return (
    <Container
      maxWidth="sm"
      sx={{
        alignItems: "center",
        bgcolor: "#F8FAFC",
        display: "flex",
        minHeight: "100vh",
        py: 6,
      }}
    >
      <Paper
        elevation={0}
        sx={{
          border: "1px solid #E2E8F0",
          borderRadius: 2,
          p: { xs: 3, sm: 4 },
          width: "100%",
        }}
      >
        <Typography color="#0F172A" component="h1" fontWeight={700} variant="h4">
          Staff Profile
        </Typography>
        <Typography color="#475569" sx={{ mt: 1, mb: 3 }} variant="body1">
          Review and update your academic staff details.
        </Typography>

        {loading ? (
          <Box
            sx={{
              alignItems: "center",
              display: "flex",
              justifyContent: "center",
              minHeight: 280,
            }}
          >
            <CircularProgress />
          </Box>
        ) : hasStaffProfile ? (
          <StaffForm
            disabled={formDisabled}
            errors={fieldErrors}
            formData={formData}
            onChange={handleChange}
            onSubmit={handleSubmit}
            saving={saving}
            submitLabel="Update Staff Profile"
          />
        ) : (
          <Alert severity="info" sx={{ borderRadius: 1 }}>
            Your profile has not been created yet. Please contact an administrator.
          </Alert>
        )}
      </Paper>

      <Snackbar
        anchorOrigin={{ horizontal: "center", vertical: "bottom" }}
        autoHideDuration={5000}
        onClose={handleCloseSnackbar}
        open={snackbar.open}
      >
        <Alert
          onClose={handleCloseSnackbar}
          severity={snackbar.severity}
          sx={{ width: "100%" }}
          variant="filled"
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default StaffProfilePage;

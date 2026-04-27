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
  adminStaffInitialData,
  createStaff,
  fetchUserRole,
  getCurrentUser,
  validateStaffForm,
} from "../services";

const requiredFields = [
  "full_name",
  "email",
  "password",
];

const AdminCreateStaffPage = () => {
  const [formData, setFormData] = useState(adminStaffInitialData);
  const [fieldErrors, setFieldErrors] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [accessChecked, setAccessChecked] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [snackbar, setSnackbar] = useState({
    message: "",
    severity: "success",
    open: false,
  });

  useEffect(() => {
    let isMounted = true;

    const checkAdminAccess = async () => {
      setLoading(true);

      try {
        const user = await getCurrentUser();
        const role = await fetchUserRole(user.id);

        if (isMounted) {
          setIsAdmin(role === "admin");
          setAccessChecked(true);
        }
      } catch (error) {
        if (isMounted) {
          setAccessChecked(true);
          setSnackbar({
            message: error.message || "Unable to verify admin access.",
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

    checkAdminAccess();

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
    setSuccessMessage("");

    if (fieldErrors[name]) {
      setFieldErrors((currentErrors) => ({
        ...currentErrors,
        [name]: "",
      }));
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const validationErrors = validateStaffForm(formData, requiredFields);
    setFieldErrors(validationErrors);

    if (Object.keys(validationErrors).length > 0) {
      return;
    }

    setSaving(true);
    setSuccessMessage("");

    try {
      const response = await createStaff(formData);
      const message =
        response?.message ||
        `Staff account for ${formData.full_name.trim()} created successfully.`;

      setFormData(adminStaffInitialData);
      setFieldErrors({});
      setSuccessMessage(message);
      setSnackbar({
        message,
        severity: "success",
        open: true,
      });
    } catch (error) {
      setSnackbar({
        message: error.message || "Unable to create staff account.",
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

  if (!loading && accessChecked && !isAdmin) {
    return <Navigate replace to="/dashboard" />;
  }

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
          Create Staff
        </Typography>
        <Typography color="#475569" sx={{ mt: 1, mb: 3 }} variant="body1">
          Create a teacher account and staff profile.
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
        ) : isAdmin ? (
          <>
            {successMessage ? (
              <Alert severity="success" sx={{ borderRadius: 1, mb: 2 }}>
                {successMessage}
              </Alert>
            ) : null}

            <StaffForm
              disabled={saving}
              errors={fieldErrors}
              formData={formData}
              includeAccountFields
              onChange={handleChange}
              onSubmit={handleSubmit}
              saving={saving}
              submitLabel="Create Staff"
            />
          </>
        ) : (
          <Alert severity="error" sx={{ borderRadius: 1 }}>
            You do not have permission to create staff profiles.
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

export default AdminCreateStaffPage;

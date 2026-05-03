import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Chip,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Divider,
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
import { useAuth } from "../../../context/AuthContext";

const STATUS_COLORS = {
  pending: "warning",
  approved: "success",
  rejected: "error",
};

const emptyEdit = {
  full_name: "",
  email: "",
  phone: "",
  date_of_birth: "",
  department_id: "",
  gpa: "",
  personal_statement: "",
  admin_notes: "",
  status: "pending",
};

export default function AdminApplicationsPage() {
  const { role } = useAuth();

  const [applications, setApplications] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [message, setMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [saving, setSaving] = useState(false);

  // Edit dialog
  const [editTarget, setEditTarget] = useState(null);
  const [editForm, setEditForm] = useState(emptyEdit);
  const [editErrors, setEditErrors] = useState({});

  // Delete confirmation dialog
  const [deleteTarget, setDeleteTarget] = useState(null);

  useEffect(() => {
    fetchApplications();
    fetchDepartments();
  }, []);

  const fetchApplications = async () => {
    const { data, error } = await supabase
      .from("admission_applications")
      .select("*, departments(name, code)")
      .order("created_at", { ascending: false });

    if (error) setErrorMessage(error.message);
    else setApplications(data || []);
  };

  const fetchDepartments = async () => {
    const { data } = await supabase
      .from("departments")
      .select("id, name, code")
      .order("name");
    setDepartments(data || []);
  };

  const filteredApplications = useMemo(() => {
    let list = applications;
    if (statusFilter !== "all") list = list.filter((a) => a.status === statusFilter);
    const q = searchQuery.trim().toLowerCase();
    if (q) {
      list = list.filter(
        (a) =>
          a.full_name?.toLowerCase().includes(q) ||
          a.email?.toLowerCase().includes(q),
      );
    }
    return list;
  }, [applications, statusFilter, searchQuery]);

  // ── Approve / Reject ──────────────────────────────────────────────────────

  const updateStatus = async (application, newStatus) => {
    setMessage("");
    setErrorMessage("");
    setSaving(true);
    try {
      const { error } = await supabase
        .from("admission_applications")
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq("id", application.id);

      if (error) { setErrorMessage(error.message); return; }

      setMessage(
        `Application from ${application.full_name} has been ${newStatus}.`,
      );
      fetchApplications();
    } finally {
      setSaving(false);
    }
  };

  // ── Edit ──────────────────────────────────────────────────────────────────

  const openEdit = (application) => {
    setEditTarget(application);
    setEditForm({
      full_name: application.full_name || "",
      email: application.email || "",
      phone: application.phone || "",
      date_of_birth: application.date_of_birth || "",
      department_id: application.department_id || "",
      gpa: application.gpa != null ? String(application.gpa) : "",
      personal_statement: application.personal_statement || "",
      admin_notes: application.admin_notes || "",
      status: application.status || "pending",
    });
    setEditErrors({});
  };

  const validateEdit = () => {
    const errs = {};
    if (!editForm.full_name.trim()) errs.full_name = "Full name is required.";
    if (!editForm.email.trim()) errs.email = "Email is required.";
    if (editForm.gpa && (isNaN(Number(editForm.gpa)) || Number(editForm.gpa) < 0 || Number(editForm.gpa) > 4))
      errs.gpa = "GPA must be between 0 and 4.";
    return errs;
  };

  const handleEditChange = (e) => {
    setEditForm({ ...editForm, [e.target.name]: e.target.value });
    if (editErrors[e.target.name]) setEditErrors({ ...editErrors, [e.target.name]: undefined });
  };

  const handleEditSave = async () => {
    const errs = validateEdit();
    if (Object.keys(errs).length) { setEditErrors(errs); return; }

    setSaving(true);
    setMessage("");
    setErrorMessage("");
    try {
      const { error } = await supabase
        .from("admission_applications")
        .update({
          full_name: editForm.full_name.trim(),
          email: editForm.email.trim(),
          phone: editForm.phone.trim() || null,
          date_of_birth: editForm.date_of_birth || null,
          department_id: editForm.department_id || null,
          gpa: editForm.gpa ? Number(editForm.gpa) : null,
          personal_statement: editForm.personal_statement.trim() || null,
          admin_notes: editForm.admin_notes.trim() || null,
          status: editForm.status,
          updated_at: new Date().toISOString(),
        })
        .eq("id", editTarget.id);

      if (error) { setErrorMessage(error.message); return; }

      setMessage("Application updated successfully.");
      setEditTarget(null);
      fetchApplications();
    } finally {
      setSaving(false);
    }
  };

  // ── Delete ────────────────────────────────────────────────────────────────

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    setSaving(true);
    setMessage("");
    setErrorMessage("");
    try {
      const { error } = await supabase
        .from("admission_applications")
        .delete()
        .eq("id", deleteTarget.id);

      if (error) { setErrorMessage(error.message); return; }

      setMessage(`Application from ${deleteTarget.full_name} has been deleted.`);
      setDeleteTarget(null);
      fetchApplications();
    } finally {
      setSaving(false);
    }
  };

  if (role && role !== "admin") {
    return (
      <Box sx={{ p: 4 }}>
        <Alert severity="error">Access denied. Admin role required.</Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "background.default", py: 4 }}>
      <Container maxWidth="xl">
        <Stack spacing={3}>
          <Box>
            <Typography variant="h4" fontWeight="bold">
              Admission Applications
            </Typography>
            <Typography color="text.secondary">
              Review, approve, reject, edit, or remove applicant submissions.
            </Typography>
          </Box>

          {message && <Alert severity="success">{message}</Alert>}
          {errorMessage && <Alert severity="error">{errorMessage}</Alert>}

          <Paper sx={{ p: 3 }}>
            <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
              <TextField
                label="Search by name or email"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                sx={{ flex: 1 }}
              />
              <TextField
                select
                label="Status"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                sx={{ minWidth: 160 }}
              >
                <MenuItem value="all">All</MenuItem>
                <MenuItem value="pending">Pending</MenuItem>
                <MenuItem value="approved">Approved</MenuItem>
                <MenuItem value="rejected">Rejected</MenuItem>
              </TextField>
            </Stack>
          </Paper>

          <Paper sx={{ overflow: "hidden" }}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Name</TableCell>
                  <TableCell>Email</TableCell>
                  <TableCell>Department</TableCell>
                  <TableCell>GPA</TableCell>
                  <TableCell>Applied</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredApplications.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7}>No applications found.</TableCell>
                  </TableRow>
                ) : (
                  filteredApplications.map((app) => (
                    <TableRow key={app.id}>
                      <TableCell>{app.full_name}</TableCell>
                      <TableCell>{app.email}</TableCell>
                      <TableCell>
                        {app.departments?.name
                          ? `${app.departments.name} (${app.departments.code})`
                          : "-"}
                      </TableCell>
                      <TableCell>{app.gpa ?? "-"}</TableCell>
                      <TableCell>
                        {new Date(app.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={app.status}
                          size="small"
                          color={STATUS_COLORS[app.status] || "default"}
                        />
                      </TableCell>
                      <TableCell>
                        <Stack direction="row" spacing={1}>
                          {app.status !== "approved" && (
                            <Button
                              size="small"
                              variant="contained"
                              color="success"
                              disabled={saving}
                              onClick={() => updateStatus(app, "approved")}
                            >
                              Approve
                            </Button>
                          )}
                          {app.status !== "rejected" && (
                            <Button
                              size="small"
                              variant="contained"
                              color="error"
                              disabled={saving}
                              onClick={() => updateStatus(app, "rejected")}
                            >
                              Reject
                            </Button>
                          )}
                          <Button
                            size="small"
                            variant="outlined"
                            disabled={saving}
                            onClick={() => openEdit(app)}
                          >
                            Edit
                          </Button>
                          <Button
                            size="small"
                            variant="outlined"
                            color="error"
                            disabled={saving}
                            onClick={() => setDeleteTarget(app)}
                          >
                            Delete
                          </Button>
                        </Stack>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </Paper>
        </Stack>
      </Container>

      {/* ── Edit Dialog ── */}
      <Dialog open={Boolean(editTarget)} onClose={() => setEditTarget(null)} maxWidth="sm" fullWidth>
        <DialogTitle>Edit Application</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              label="Full Name"
              name="full_name"
              value={editForm.full_name}
              onChange={handleEditChange}
              error={Boolean(editErrors.full_name)}
              helperText={editErrors.full_name}
              required
            />
            <TextField
              label="Email"
              name="email"
              value={editForm.email}
              onChange={handleEditChange}
              error={Boolean(editErrors.email)}
              helperText={editErrors.email}
              required
            />
            <TextField
              label="Phone"
              name="phone"
              value={editForm.phone}
              onChange={handleEditChange}
            />
            <TextField
              label="Date of Birth"
              name="date_of_birth"
              type="date"
              value={editForm.date_of_birth}
              onChange={handleEditChange}
              InputLabelProps={{ shrink: true }}
            />
            <TextField
              select
              label="Department"
              name="department_id"
              value={editForm.department_id}
              onChange={handleEditChange}
            >
              <MenuItem value="">None</MenuItem>
              {departments.map((dept) => (
                <MenuItem key={dept.id} value={dept.id}>
                  {dept.name} ({dept.code})
                </MenuItem>
              ))}
            </TextField>
            <TextField
              label="GPA (0 – 4)"
              name="gpa"
              value={editForm.gpa}
              onChange={handleEditChange}
              error={Boolean(editErrors.gpa)}
              helperText={editErrors.gpa}
            />
            <TextField
              select
              label="Status"
              name="status"
              value={editForm.status}
              onChange={handleEditChange}
            >
              <MenuItem value="pending">Pending</MenuItem>
              <MenuItem value="approved">Approved</MenuItem>
              <MenuItem value="rejected">Rejected</MenuItem>
            </TextField>
            <TextField
              label="Personal Statement"
              name="personal_statement"
              value={editForm.personal_statement}
              onChange={handleEditChange}
              multiline
              rows={3}
            />
            <Divider />
            <TextField
              label="Admin Notes"
              name="admin_notes"
              value={editForm.admin_notes}
              onChange={handleEditChange}
              multiline
              rows={2}
              placeholder="Internal notes (not visible to applicant)"
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditTarget(null)} disabled={saving}>Cancel</Button>
          <Button variant="contained" onClick={handleEditSave} disabled={saving}>
            {saving ? "Saving…" : "Save Changes"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ── Delete Confirmation Dialog ── */}
      <Dialog open={Boolean(deleteTarget)} onClose={() => setDeleteTarget(null)}>
        <DialogTitle>Delete Application</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to permanently delete the application from{" "}
            <strong>{deleteTarget?.full_name}</strong>? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteTarget(null)} disabled={saving}>Cancel</Button>
          <Button variant="contained" color="error" onClick={handleDeleteConfirm} disabled={saving}>
            {saving ? "Deleting…" : "Delete"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

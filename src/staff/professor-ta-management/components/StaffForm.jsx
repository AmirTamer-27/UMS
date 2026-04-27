import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import CircularProgress from "@mui/material/CircularProgress";
import TextField from "@mui/material/TextField";

const StaffForm = ({
  disabled = false,
  errors,
  formData,
  includeAccountFields = false,
  onChange,
  onSubmit,
  saving = false,
  submitLabel = "Save Staff Profile",
}) => (
  <Box component="form" noValidate onSubmit={onSubmit}>
    {includeAccountFields ? (
      <>
        <TextField
          disabled={disabled}
          error={Boolean(errors.full_name)}
          fullWidth
          helperText={errors.full_name}
          InputLabelProps={{ shrink: true }}
          label="Full Name"
          margin="normal"
          name="full_name"
          onChange={onChange}
          required
          value={formData.full_name}
        />

        <TextField
          disabled={disabled}
          error={Boolean(errors.email)}
          fullWidth
          helperText={errors.email}
          InputLabelProps={{ shrink: true }}
          label="Email"
          margin="normal"
          name="email"
          onChange={onChange}
          required
          type="email"
          value={formData.email}
        />

        <TextField
          disabled={disabled}
          error={Boolean(errors.password)}
          fullWidth
          helperText={errors.password}
          InputLabelProps={{ shrink: true }}
          label="Temporary Password"
          margin="normal"
          name="password"
          onChange={onChange}
          required
          type="password"
          value={formData.password}
        />
      </>
    ) : null}

    <TextField
      disabled={disabled}
      error={Boolean(errors.staff_number)}
      fullWidth
      helperText={errors.staff_number}
      InputLabelProps={{ shrink: true }}
      label="Staff Number"
      margin="normal"
      name="staff_number"
      onChange={onChange}
      required
      value={formData.staff_number}
    />

    <TextField
      disabled={disabled}
      error={Boolean(errors.title)}
      fullWidth
      helperText={errors.title}
      InputLabelProps={{ shrink: true }}
      label="Title"
      margin="normal"
      name="title"
      onChange={onChange}
      required
      value={formData.title}
    />

    <TextField
      disabled={disabled}
      error={Boolean(errors.office_hours)}
      fullWidth
      helperText={errors.office_hours}
      InputLabelProps={{ shrink: true }}
      label="Office Hours"
      margin="normal"
      name="office_hours"
      onChange={onChange}
      placeholder="Sunday and Tuesday, 10:00 AM - 12:00 PM"
      required
      value={formData.office_hours}
    />

    <TextField
      disabled={disabled}
      fullWidth
      InputLabelProps={{ shrink: true }}
      label="Bio"
      margin="normal"
      minRows={4}
      multiline
      name="bio"
      onChange={onChange}
      value={formData.bio}
    />

    <Button
      disabled={disabled}
      fullWidth
      size="large"
      sx={{
        mt: 3,
        py: 1.25,
        bgcolor: "#1E3A8A",
        "&:hover": {
          bgcolor: "#172F73",
        },
      }}
      type="submit"
      variant="contained"
    >
      {saving ? <CircularProgress color="inherit" size={24} /> : submitLabel}
    </Button>
  </Box>
);

export default StaffForm;

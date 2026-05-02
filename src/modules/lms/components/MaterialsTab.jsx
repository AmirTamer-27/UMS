import { useState, useEffect } from "react";
import {
  Box,
  Button,
  Card,
  CardContent,
  Grid,
  Stack,
  TextField,
  Typography,
  Alert,
  CircularProgress,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  IconButton,
} from "@mui/material";
import InsertDriveFileOutlinedIcon from "@mui/icons-material/InsertDriveFileOutlined";
import CloudUploadOutlinedIcon from "@mui/icons-material/CloudUploadOutlined";
import DownloadOutlinedIcon from "@mui/icons-material/DownloadOutlined";

import {
  getCourseMaterials,
  uploadMaterial,
  getMaterialDownloadUrl,
} from "../services/lmsService";

const MaterialsTab = ({ courseOfferingId, userRole, userId }) => {
  const [materials, setMaterials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [title, setTitle] = useState("");
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");

  const isInstructor = userRole === "instructor" || userRole === "admin" || userRole === "teacher" || userRole === "staff";

  useEffect(() => {
    loadMaterials();
  }, [courseOfferingId]);

  const loadMaterials = async () => {
    try {
      setLoading(true);
      const data = await getCourseMaterials(courseOfferingId);
      setMaterials(data || []);
    } catch (err) {
      setError(err.message || "Failed to load materials");
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!title || !file) {
      setUploadError("Please provide a title and select a file.");
      return;
    }

    try {
      setUploading(true);
      setUploadError("");
      await uploadMaterial(courseOfferingId, title, file, userId);
      setTitle("");
      setFile(null);
      await loadMaterials();
    } catch (err) {
      setUploadError(err.message || "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const handleDownload = async (filePath) => {
    try {
      const url = await getMaterialDownloadUrl(filePath);
      if (url) {
        window.open(url, "_blank");
      }
    } catch (err) {
      alert("Failed to get download link");
    }
  };

  if (loading) return <CircularProgress />;

  return (
    <Box>
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {isInstructor && (
        <Card sx={{ mb: 4, bgcolor: "background.paper" }}>
          <CardContent>
            <Typography variant="h6" fontWeight="bold" sx={{ mb: 2 }}>
              Upload New Material
            </Typography>
            <form onSubmit={handleUpload}>
              <Stack spacing={3}>
                <TextField
                  label="Material Title"
                  variant="outlined"
                  fullWidth
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  disabled={uploading}
                />
                <Box>
                  <Button
                    variant="outlined"
                    component="label"
                    startIcon={<CloudUploadOutlinedIcon />}
                    disabled={uploading}
                  >
                    Select File
                    <input type="file" hidden onChange={handleFileChange} />
                  </Button>
                  {file && (
                    <Typography variant="caption" sx={{ ml: 2, color: "text.secondary" }}>
                      {file.name}
                    </Typography>
                  )}
                </Box>
                {uploadError && <Alert severity="error">{uploadError}</Alert>}
                <Box>
                  <Button
                    type="submit"
                    variant="contained"
                    color="primary"
                    disabled={uploading}
                  >
                    {uploading ? "Uploading..." : "Upload Material"}
                  </Button>
                </Box>
              </Stack>
            </form>
          </CardContent>
        </Card>
      )}

      <Typography variant="h6" fontWeight="bold" sx={{ mb: 2 }}>
        Course Materials
      </Typography>

      {materials.length === 0 ? (
        <Typography color="text.secondary">No materials uploaded yet.</Typography>
      ) : (
        <List sx={{ bgcolor: "background.paper", borderRadius: 1 }}>
          {materials.map((mat) => (
            <ListItem
              key={mat.id}
              divider
              secondaryAction={
                mat.file_path && (
                  <IconButton
                    edge="end"
                    aria-label="download"
                    onClick={() => handleDownload(mat.file_path)}
                  >
                    <DownloadOutlinedIcon />
                  </IconButton>
                )
              }
            >
              <ListItemIcon>
                <InsertDriveFileOutlinedIcon color="primary" />
              </ListItemIcon>
              <ListItemText
                primary={mat.title}
                secondary={`Uploaded by ${mat.profiles?.full_name || "Unknown"} on ${new Date(mat.created_at).toLocaleDateString()}`}
                primaryTypographyProps={{ fontWeight: 500 }}
              />
            </ListItem>
          ))}
        </List>
      )}
    </Box>
  );
};

export default MaterialsTab;

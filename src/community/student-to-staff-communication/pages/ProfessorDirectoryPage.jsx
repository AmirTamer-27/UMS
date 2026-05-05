import { useEffect, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Container,
  Grid,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import EmailOutlinedIcon from "@mui/icons-material/EmailOutlined";
import PersonSearchOutlinedIcon from "@mui/icons-material/PersonSearchOutlined";
import SchoolOutlinedIcon from "@mui/icons-material/SchoolOutlined";

import {
  fetchDepartments,
  fetchProfessorDirectory,
} from "../services";

const ProfessorDirectoryPage = () => {
  const [departments, setDepartments] = useState([]);
  const [departmentId, setDepartmentId] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(0);
  const [professors, setProfessors] = useState([]);
  const [searchInput, setSearchInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [total, setTotal] = useState(0);

  useEffect(() => {
    let mounted = true;

    const loadDepartments = async () => {
      try {
        const nextDepartments = await fetchDepartments();

        if (mounted) {
          setDepartments(nextDepartments);
        }
      } catch (error) {
        if (mounted) {
          setErrorMessage(error.message || "Unable to load departments.");
        }
      }
    };

    loadDepartments();

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    let mounted = true;

    const loadProfessors = async () => {
      setLoading(true);
      setErrorMessage("");

      try {
        const result = await fetchProfessorDirectory({
          departmentId,
          page: 0,
          search: searchQuery,
        });

        if (mounted) {
          setProfessors(result.professors);
          setHasMore(result.hasMore);
          setTotal(result.total);
          setPage(0);
        }
      } catch (error) {
        if (mounted) {
          setErrorMessage(error.message || "Unable to load professors.");
          setProfessors([]);
          setHasMore(false);
          setTotal(0);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    loadProfessors();

    return () => {
      mounted = false;
    };
  }, [departmentId, searchQuery]);

  const handleSearch = (event) => {
    event.preventDefault();
    setSearchQuery(searchInput.trim());
  };

  const handleClear = () => {
    setDepartmentId("");
    setSearchInput("");
    setSearchQuery("");
  };

  const handleViewMore = async () => {
    const nextPage = page + 1;
    setLoadingMore(true);
    setErrorMessage("");

    try {
      const result = await fetchProfessorDirectory({
        departmentId,
        page: nextPage,
        search: searchQuery,
      });

      setProfessors((currentProfessors) => [
        ...currentProfessors,
        ...result.professors,
      ]);
      setHasMore(result.hasMore);
      setTotal(result.total);
      setPage(nextPage);
    } catch (error) {
      setErrorMessage(error.message || "Unable to load more professors.");
    } finally {
      setLoadingMore(false);
    }
  };

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "background.default", py: 4 }}>
      <Container maxWidth="lg">
        <Stack spacing={3}>
          <Box>
            <Typography component="h1" fontWeight={900} variant="h4">
              Professor Directory
            </Typography>
            <Typography color="text.secondary">
              Find professor details by name or department.
            </Typography>
          </Box>

          <Card>
            <CardContent sx={{ p: 3 }}>
              <Stack
                component="form"
                direction={{ xs: "column", md: "row" }}
                onSubmit={handleSearch}
                spacing={2}
              >
                <TextField
                  fullWidth
                  label="Search by professor name"
                  onChange={(event) => setSearchInput(event.target.value)}
                  value={searchInput}
                />
                <TextField
                  label="Department"
                  onChange={(event) => setDepartmentId(event.target.value)}
                  select
                  sx={{ minWidth: { xs: "100%", md: 260 } }}
                  value={departmentId}
                >
                  <MenuItem value="">All departments</MenuItem>
                  {departments.map((department) => (
                    <MenuItem key={department.id} value={department.id}>
                      {department.name} ({department.code})
                    </MenuItem>
                  ))}
                </TextField>
                <Stack direction="row" spacing={1.5}>
                  <Button
                    startIcon={<PersonSearchOutlinedIcon />}
                    type="submit"
                    variant="contained"
                  >
                    Search
                  </Button>
                  <Button onClick={handleClear} variant="outlined">
                    Clear
                  </Button>
                </Stack>
              </Stack>
            </CardContent>
          </Card>

          {errorMessage ? <Alert severity="error">{errorMessage}</Alert> : null}

          <Stack
            alignItems={{ xs: "flex-start", sm: "center" }}
            direction={{ xs: "column", sm: "row" }}
            justifyContent="space-between"
            spacing={1}
          >
            <Typography color="text.secondary" variant="body2">
              {loading ? "Loading matching profiles..." : `${total} matching profiles`}
            </Typography>
          </Stack>

          {loading ? (
            <Stack alignItems="center" sx={{ py: 8 }}>
              <CircularProgress />
            </Stack>
          ) : professors.length === 0 ? (
            <Card>
              <CardContent sx={{ p: 3 }}>
                <Typography fontWeight={700}>No professors found.</Typography>
                <Typography color="text.secondary" variant="body2">
                  Try a different name or department.
                </Typography>
              </CardContent>
            </Card>
          ) : (
            <Grid container spacing={2.5}>
              {professors.map((professor) => {
                const staffProfile = Array.isArray(professor.staff_profiles)
                  ? professor.staff_profiles[0]
                  : professor.staff_profiles;
                const department = professor.departments;

                return (
                  <Grid item key={professor.id} xs={12} md={6}>
                    <Card sx={{ height: "100%" }}>
                      <CardContent sx={{ p: 3 }}>
                        <Stack spacing={2}>
                          <Stack
                            alignItems="flex-start"
                            direction={{ xs: "column", sm: "row" }}
                            justifyContent="space-between"
                            spacing={1.5}
                          >
                            <Box>
                              <Typography fontWeight={900} variant="h6">
                                {professor.full_name || "Unnamed professor"}
                              </Typography>
                              <Typography color="text.secondary" variant="body2">
                                {staffProfile?.title || "Academic staff"}
                              </Typography>
                            </Box>
                            {department ? (
                              <Chip
                                color="secondary"
                                label={`${department.name} (${department.code})`}
                                size="small"
                                variant="outlined"
                              />
                            ) : null}
                          </Stack>

                          <Stack spacing={1}>
                            <Stack alignItems="center" direction="row" spacing={1}>
                              <EmailOutlinedIcon color="primary" fontSize="small" />
                              <Typography variant="body2">
                                {professor.email || "Email unavailable"}
                              </Typography>
                            </Stack>
                            <Stack alignItems="center" direction="row" spacing={1}>
                              <SchoolOutlinedIcon color="primary" fontSize="small" />
                              <Typography variant="body2">
                                Office hours: {staffProfile?.office_hours || "Not listed"}
                              </Typography>
                            </Stack>
                          </Stack>

                          {staffProfile?.bio ? (
                            <Typography color="text.secondary" variant="body2">
                              {staffProfile.bio}
                            </Typography>
                          ) : null}
                        </Stack>
                      </CardContent>
                    </Card>
                  </Grid>
                );
              })}
            </Grid>
          )}

          {hasMore ? (
            <Stack alignItems="center">
              <Button
                disabled={loadingMore}
                onClick={handleViewMore}
                variant="outlined"
              >
                {loadingMore ? "Loading..." : "View More"}
              </Button>
            </Stack>
          ) : null}
        </Stack>
      </Container>
    </Box>
  );
};

export default ProfessorDirectoryPage;

import React from 'react';
import { useState } from 'react';
import { ThemeProvider } from '@mui/material/styles';
import { Container, Box, Typography, Paper } from '@mui/material';
import theme from './theme';
import OfferingForm from './OfferingForm';
import PublishedOfferingsTable from './PublishedOfferingsTable';

export default function AdminCourseOfferingPage() {
  const [refreshKey, setRefreshKey] = useState(0);

  return (
    <ThemeProvider theme={theme}>
      <Box sx={{ backgroundColor: theme.palette.background.default, minHeight: '100vh', py: 6 }}>
        <Container maxWidth="lg">
          <Typography variant="h4" gutterBottom>
            Course Offerings — Admin
          </Typography>

          <Paper sx={{ p: 3, mb: 4 }} elevation={1}>
            <OfferingForm onOfferingCreated={() => setRefreshKey((key) => key + 1)} />
          </Paper>

          <Paper sx={{ p: 3 }} elevation={1}>
            <PublishedOfferingsTable refreshKey={refreshKey} />
          </Paper>
        </Container>
      </Box>
    </ThemeProvider>
  );
}

import {
  Box,
  Card,
  CardContent,
  Divider,
  Stack,
  Typography,
} from "@mui/material";
import HistoryOutlinedIcon from "@mui/icons-material/HistoryOutlined";

const RecentActivityCard = ({ children }) => (
  <Card>
    <CardContent sx={{ p: 3 }}>
      <Stack spacing={2}>
        <Stack alignItems="center" direction="row" spacing={1.5}>
          <Box
            sx={{
              alignItems: "center",
              bgcolor: "rgba(15, 118, 110, 0.10)",
              borderRadius: 1,
              color: "secondary.main",
              display: "flex",
              height: 40,
              justifyContent: "center",
              width: 40,
            }}
          >
            <HistoryOutlinedIcon fontSize="small" />
          </Box>
          <Box>
            <Typography fontWeight={900} variant="h6">
              Recent Activity
            </Typography>
            <Typography color="text.secondary" variant="body2">
              Latest updates will be summarized here.
            </Typography>
          </Box>
        </Stack>
        <Divider />
        <Box
          sx={{
            bgcolor: "background.default",
            border: 1,
            borderColor: "divider",
            borderRadius: 1,
            p: 2,
          }}
        >
          <Typography color="text.secondary" variant="body2">
            {children}
          </Typography>
        </Box>
      </Stack>
    </CardContent>
  </Card>
);

export default RecentActivityCard;

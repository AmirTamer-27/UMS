import { useState } from "react";

import {
  AppBar,
  Avatar,
  Box,
  Chip,
  Divider,
  Drawer,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Stack,
  Toolbar,
  Typography,
} from "@mui/material";
import AdminPanelSettingsOutlinedIcon from "@mui/icons-material/AdminPanelSettingsOutlined";
import ApartmentOutlinedIcon from "@mui/icons-material/ApartmentOutlined";
import DashboardOutlinedIcon from "@mui/icons-material/DashboardOutlined";
import LibraryBooksOutlinedIcon from "@mui/icons-material/LibraryBooksOutlined";
import MenuBookOutlinedIcon from "@mui/icons-material/MenuBookOutlined";
import MessageOutlinedIcon from "@mui/icons-material/MessageOutlined";

const drawerWidth = 240;

const baseNavigation = ["Dashboard", "Courses", "LMS", "Rooms", "Messages"];

const navigationIcons = {
  Dashboard: DashboardOutlinedIcon,
  Courses: MenuBookOutlinedIcon,
  LMS: LibraryBooksOutlinedIcon,
  Rooms: ApartmentOutlinedIcon,
  Admin: AdminPanelSettingsOutlinedIcon,
  Messages: MessageOutlinedIcon,
};

const MainLayout = ({ children, profile }) => {
  const [activeItem, setActiveItem] = useState("Dashboard");
  const role = profile?.role || "student";
  const displayName = profile?.name || profile?.full_name || "User";
  const initials = displayName
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
  const navigation =
    role === "admin"
      ? ["Dashboard", "Courses", "LMS", "Rooms", "Admin", "Messages"]
      : baseNavigation;

  return (
    <Box
      sx={{
        display: "flex",
        width: "100%",
        minHeight: "100vh",
        overflowX: "hidden",
        bgcolor: "background.default",
      }}
    >
      <AppBar
        position="fixed"
        color="inherit"
        elevation={0}
        sx={{
          borderBottom: 1,
          borderColor: "divider",
          width: { md: `calc(100% - ${drawerWidth}px)` },
          ml: { md: `${drawerWidth}px` },
        }}
      >
        <Toolbar sx={{ minHeight: 72, px: { xs: 2, md: 4 }, justifyContent: "space-between" }}>
          <Box>
            <Typography color="primary" fontWeight={800} variant="h6">
              University Management System
            </Typography>
            <Typography color="text.secondary" variant="caption">
              Academic operations dashboard
            </Typography>
          </Box>
          <Stack alignItems="center" direction="row" spacing={1.5}>
            <Chip
              color="secondary"
              label={role}
              size="small"
              sx={{ borderRadius: 1, fontWeight: 700, textTransform: "capitalize" }}
            />
            <Avatar sx={{ bgcolor: "primary.main", fontWeight: 800 }}>
              {initials}
            </Avatar>
          </Stack>
        </Toolbar>
      </AppBar>

      <Drawer
        open
        variant="permanent"
        sx={{
          display: { xs: "none", md: "block" },
          position: { md: "fixed" },
          width: drawerWidth,
          flexShrink: 0,
          "& .MuiDrawer-paper": {
            boxSizing: "border-box",
            width: drawerWidth,
            borderColor: "divider",
            bgcolor: "background.paper",
          },
        }}
      >
        <Toolbar sx={{ minHeight: 72, px: 3 }}>
          <Stack spacing={0.25}>
            <Typography color="primary" fontWeight={900} variant="h6">
              UMS
            </Typography>
          </Stack>
        </Toolbar>
        <Divider />
        <List sx={{ p: 2 }}>
          {navigation.map((item) => (
            <ListItemButton
              key={item}
              onClick={() => setActiveItem(item)}
              selected={activeItem === item}
              sx={{
                borderRadius: 1,
                mb: 1,
                minHeight: 48,
                px: 1.5,
                color: activeItem === item ? "primary.main" : "text.secondary",
                "&.Mui-selected": {
                  bgcolor: "rgba(30, 58, 138, 0.08)",
                  color: "primary.main",
                  border: 1,
                  borderColor: "rgba(30, 58, 138, 0.18)",
                },
                "&.Mui-selected:hover": {
                  bgcolor: "rgba(30, 58, 138, 0.12)",
                },
                "&:hover": {
                  bgcolor: "rgba(15, 118, 110, 0.08)",
                  color: "secondary.main",
                },
              }}
            >
              <ListItemIcon sx={{ color: "inherit", minWidth: 38 }}>
                {(() => {
                  const Icon = navigationIcons[item];
                  return <Icon fontSize="small" />;
                })()}
              </ListItemIcon>
              <ListItemText
                primary={item}
                primaryTypographyProps={{ fontWeight: 800, variant: "body2" }}
              />
            </ListItemButton>
          ))}
        </List>
      </Drawer>

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          ml: { md: `${drawerWidth}px` },
          minWidth: 0,
          overflowX: "hidden",
          pl: 0,
          pr: 3,
          pb: 3,
          pt: 9,
          width: "100%",
          "& .MuiContainer-root": {
            maxWidth: "none",
            ml: 0,
            mr: 0,
            pl: 0,
          },
        }}
      >
        <Box sx={{ width: "100%" }}>{children}</Box>
      </Box>
    </Box>
  );
};

export default MainLayout;

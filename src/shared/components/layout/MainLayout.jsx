import { useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";

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
import LogoutOutlinedIcon from "@mui/icons-material/LogoutOutlined";
import MenuBookOutlinedIcon from "@mui/icons-material/MenuBookOutlined";
import MessageOutlinedIcon from "@mui/icons-material/MessageOutlined";
import PeopleAltOutlinedIcon from "@mui/icons-material/PeopleAltOutlined";

import { useAuth } from "../../../context/AuthContext";

const drawerWidth = 240;

const baseNavigation = [
  { label: "Dashboard", path: "/dashboard", icon: DashboardOutlinedIcon },
  { label: "Courses", path: "/courses/registration", icon: MenuBookOutlinedIcon },
  { label: "Rooms", path: "/facilities/classrooms", icon: ApartmentOutlinedIcon },
  { label: "Messages", path: "/messages", icon: MessageOutlinedIcon },
];

const adminNavigationItems = [
  { label: "Students", path: "/admin/student-records", icon: PeopleAltOutlinedIcon },
  { label: "Admin", path: "/admin/course-offerings", icon: AdminPanelSettingsOutlinedIcon },
];

const MainLayout = ({ children, profile }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout } = useAuth();
  const role = profile?.role || "student";
  const displayName = profile?.name || profile?.full_name || "User";

  const initials = displayName
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const navigation = useMemo(() => {
    const coursesItem =
      role === "admin"
        ? { ...baseNavigation[1], path: "/admin/course-offerings" }
        : baseNavigation[1];
    const roleNavigation = [
      baseNavigation[0],
      coursesItem,
      ...baseNavigation.slice(2, 3),
    ];

    return role === "admin"
      ? [...roleNavigation, ...adminNavigationItems, baseNavigation[3]]
      : roleNavigation;
  }, [role]);

  const getIsActive = (path) => {
    if (path === "/dashboard") return location.pathname === "/dashboard";
    return location.pathname.startsWith(path);
  };

  const handleLogout = async () => {
    await logout();
    navigate("/login", { replace: true });
  };

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
        <Toolbar
          sx={{
            minHeight: 72,
            px: { xs: 2, md: 4 },
            justifyContent: "space-between",
          }}
        >
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
              sx={{
                borderRadius: 1,
                fontWeight: 700,
                textTransform: "capitalize",
              }}
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
          <Typography color="primary" fontWeight={900} variant="h6">
            UMS
          </Typography>
        </Toolbar>

        <Divider />

        <List sx={{ p: 2 }}>
          {navigation.map((item) => (
            <ListItemButton
              key={item.path}
              onClick={() => navigate(item.path)}
              selected={getIsActive(item.path)}
              sx={{
                borderRadius: 1,
                mb: 1,
                minHeight: 48,
                px: 1.5,
                color: getIsActive(item.path) ? "primary.main" : "text.secondary",
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
                <item.icon fontSize="small" />
              </ListItemIcon>
              <ListItemText
                primary={item.label}
                primaryTypographyProps={{ fontWeight: 800, variant: "body2" }}
              />
            </ListItemButton>
          ))}

          <Divider sx={{ my: 2 }} />

          <ListItemButton
            onClick={handleLogout}
            sx={{
              borderRadius: 1,
              minHeight: 48,
              px: 1.5,
              color: "text.secondary",
              "&:hover": {
                bgcolor: "rgba(220, 38, 38, 0.08)",
                color: "error.main",
              },
            }}
          >
            <ListItemIcon sx={{ color: "inherit", minWidth: 38 }}>
              <LogoutOutlinedIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText
              primary="Logout"
              primaryTypographyProps={{ fontWeight: 800, variant: "body2" }}
            />
          </ListItemButton>
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

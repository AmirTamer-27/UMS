import { useCallback, useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

import {
  AppBar,
  Avatar,
  Badge,
  Box,
  Chip,
  CircularProgress,
  Divider,
  Drawer,
  IconButton,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Menu,
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
import NotificationsNoneOutlinedIcon from "@mui/icons-material/NotificationsNoneOutlined";
import PeopleAltOutlinedIcon from "@mui/icons-material/PeopleAltOutlined";

import { useAuth } from "../../../context/AuthContext";
import { supabase } from "../../../services/supabase/client";

const drawerWidth = 240;

const baseNavigation = [
  { label: "Dashboard", path: "/dashboard", icon: DashboardOutlinedIcon },
  { label: "Courses", path: "/courses/registration", icon: MenuBookOutlinedIcon },
  { label: "Rooms", path: "/facilities/classrooms", icon: ApartmentOutlinedIcon },
  { label: "Messages", path: "/messages", icon: MessageOutlinedIcon },
];

const adminNavigationItems = [
  { label: "Students", path: "/admin/student-records", icon: PeopleAltOutlinedIcon },
  { label: "Course Offerings", path: "/admin/course-offerings", icon: AdminPanelSettingsOutlinedIcon },
];

const roleAliases = {
  teacher: "instructor",
  staff: "instructor",
};

const notificationRoles = new Set(["student", "instructor", "parent"]);

const getRelativeTime = (dateValue) => {
  if (!dateValue) {
    return "";
  }

  const timestamp = new Date(dateValue).getTime();

  if (Number.isNaN(timestamp)) {
    return "";
  }

  const seconds = Math.max(0, Math.floor((Date.now() - timestamp) / 1000));

  if (seconds < 60) {
    return "Just now";
  }

  const minutes = Math.floor(seconds / 60);

  if (minutes < 60) {
    return `${minutes} min ago`;
  }

  const hours = Math.floor(minutes / 60);

  if (hours < 24) {
    return `${hours} hr ago`;
  }

  const days = Math.floor(hours / 24);

  if (days < 7) {
    return `${days} day${days === 1 ? "" : "s"} ago`;
  }

  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(dateValue));
};

const getNotificationBody = (notification) => {
  const body = notification.body || "You have a new message.";
  const courseName = notification.course_offerings?.courses?.name;

  if (notification.type === "material" && courseName) {
    const materialBody = body.replace(/^New Material:\s*/i, "");
    return `New material in ${courseName}: ${materialBody}`;
  }

  return body;
};

const MainLayout = ({ children, profile }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout, user } = useAuth();
  const role = profile?.role || "student";
  const navigationRole = roleAliases[role] || role;
  const displayName = profile?.name || profile?.full_name || "User";
  const [notifications, setNotifications] = useState([]);
  const [notificationsLoading, setNotificationsLoading] = useState(false);
  const [notificationAnchorEl, setNotificationAnchorEl] = useState(null);
  const canShowNotifications = notificationRoles.has(navigationRole);
  const isNotificationMenuOpen = Boolean(notificationAnchorEl);

  const initials = displayName
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const navigation = useMemo(() => {
    const [dashboard, courses, rooms, messages] = baseNavigation;

    const navigationByRole = {
      admin: [dashboard, ...adminNavigationItems, messages],
      student: [dashboard, courses, messages],
      instructor: [dashboard, rooms, messages],
      parent: [dashboard, messages],
    };

    return navigationByRole[navigationRole] || navigationByRole.student;
  }, [navigationRole]);

  const unreadCount = useMemo(
    () => notifications.filter((notification) => !notification.is_read).length,
    [notifications],
  );

  const fetchNotifications = useCallback(async () => {
    if (!supabase || !user?.id || !canShowNotifications) {
      setNotifications([]);
      setNotificationsLoading(false);
      return;
    }

    setNotificationsLoading(true);

    try {
      const { data, error } = await supabase
        .from("notifications")
        .select(`
          *,
          course_offerings (
            id,
            courses (
              name
            )
          )
        `)
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) {
        throw error;
      }

      setNotifications(data || []);
    } catch (notificationError) {
      setNotifications([]);
    } finally {
      setNotificationsLoading(false);
    }
  }, [canShowNotifications, user?.id]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  useEffect(() => {
    if (!supabase || !user?.id || !canShowNotifications) {
      return undefined;
    }

    const channel = supabase
      .channel("notifications")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
        },
        (payload) => {
          const nextNotification = payload.new;

          if (nextNotification?.user_id !== user.id) {
            return;
          }

          setNotifications((currentNotifications) => [
            nextNotification,
            ...currentNotifications.filter(
              (notification) => notification.id !== nextNotification.id,
            ),
          ]);
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [canShowNotifications, user?.id]);

  const getIsActive = (path) => {
    if (path === "/dashboard") return location.pathname === "/dashboard";
    return location.pathname.startsWith(path);
  };

  const handleLogout = async () => {
    await logout();
    navigate("/login", { replace: true });
  };

  const handleOpenNotifications = (event) => {
    setNotificationAnchorEl(event.currentTarget);
  };

  const handleCloseNotifications = () => {
    setNotificationAnchorEl(null);
  };

  const getMessagesPath = () => {
    if (navigationRole === "parent") {
      return "/parent/messages";
    }

    if (navigationRole === "instructor") {
      return "/teacher/messages";
    }

    return "/messages";
  };

  const handleNotificationClick = async (notification) => {
    handleCloseNotifications();

    if (!notification.is_read) {
      setNotifications((currentNotifications) =>
        currentNotifications.map((currentNotification) =>
          currentNotification.id === notification.id
            ? { ...currentNotification, is_read: true }
            : currentNotification,
        ),
      );

      if (supabase) {
        const { error } = await supabase
          .from("notifications")
          .update({ is_read: true })
          .eq("id", notification.id)
          .eq("user_id", user.id);

        if (error) {
          setNotifications((currentNotifications) =>
            currentNotifications.map((currentNotification) =>
              currentNotification.id === notification.id
                ? { ...currentNotification, is_read: false }
                : currentNotification,
            ),
          );
          return;
        }
      }
    }

    if (notification.message_id) {
      navigate(getMessagesPath());
    }
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
            {canShowNotifications ? (
              <>
                <IconButton
                  aria-label="Open notifications"
                  color="primary"
                  onClick={handleOpenNotifications}
                  sx={{
                    borderRadius: 1,
                    height: 40,
                    width: 40,
                  }}
                >
                  <Badge badgeContent={unreadCount} color="error" max={99}>
                    <NotificationsNoneOutlinedIcon fontSize="small" />
                  </Badge>
                </IconButton>
                <Menu
                  anchorEl={notificationAnchorEl}
                  onClose={handleCloseNotifications}
                  open={isNotificationMenuOpen}
                  PaperProps={{
                    sx: {
                      border: 1,
                      borderColor: "divider",
                      boxShadow: "0 18px 40px rgba(15, 23, 42, 0.16)",
                      mt: 1,
                      width: { xs: 320, sm: 380 },
                    },
                  }}
                >
                  <Box sx={{ px: 2, py: 1.5 }}>
                    <Typography color="text.primary" fontWeight={900}>
                      Notifications
                    </Typography>
                    <Typography color="text.secondary" variant="caption">
                      Message alerts and updates
                    </Typography>
                  </Box>
                  <Divider />

                  {notificationsLoading ? (
                    <Box
                      sx={{
                        alignItems: "center",
                        display: "flex",
                        justifyContent: "center",
                        minHeight: 120,
                      }}
                    >
                      <CircularProgress size={24} />
                    </Box>
                  ) : null}

                  {!notificationsLoading && !notifications.length ? (
                    <Box sx={{ px: 2, py: 3 }}>
                      <Typography color="text.secondary">
                        No notifications
                      </Typography>
                    </Box>
                  ) : null}

                  {!notificationsLoading && notifications.length ? (
                    <List disablePadding sx={{ maxHeight: 420, overflowY: "auto" }}>
                      {notifications.map((notification) => (
                        <ListItemButton
                          key={notification.id}
                          onClick={() => handleNotificationClick(notification)}
                          sx={{
                            alignItems: "flex-start",
                            borderBottom: 1,
                            borderColor: "divider",
                            gap: 1.5,
                            px: 2,
                            py: 1.5,
                          }}
                        >
                          <Box
                            sx={{
                              bgcolor: notification.is_read
                                ? "divider"
                                : "secondary.main",
                              borderRadius: "50%",
                              flexShrink: 0,
                              height: 8,
                              mt: 0.75,
                              width: 8,
                            }}
                          />
                          <Box sx={{ minWidth: 0 }}>
                            <Typography
                              color="text.primary"
                              fontWeight={notification.is_read ? 700 : 900}
                              variant="body2"
                            >
                              {notification.title || "New notification"}
                            </Typography>
                            <Typography
                              color="text.secondary"
                              sx={{
                                display: "-webkit-box",
                                lineHeight: 1.45,
                                mt: 0.5,
                                overflow: "hidden",
                                WebkitBoxOrient: "vertical",
                                WebkitLineClamp: 2,
                              }}
                              variant="body2"
                            >
                              {getNotificationBody(notification)}
                            </Typography>
                            <Typography
                              color="text.secondary"
                              sx={{ display: "block", mt: 0.75 }}
                              variant="caption"
                            >
                              {getRelativeTime(notification.created_at)}
                            </Typography>
                          </Box>
                        </ListItemButton>
                      ))}
                    </List>
                  ) : null}
                </Menu>
              </>
            ) : null}
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

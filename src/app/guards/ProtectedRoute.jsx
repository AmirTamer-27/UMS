import { Navigate } from "react-router-dom";

import Box from "@mui/material/Box";
import CircularProgress from "@mui/material/CircularProgress";

import { useAuth } from "../../context/AuthContext";

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <Box
        sx={{
          alignItems: "center",
          bgcolor: "background.default",
          display: "flex",
          justifyContent: "center",
          minHeight: "100vh",
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  return isAuthenticated ? children : <Navigate replace to="/login" />;
};

export default ProtectedRoute;

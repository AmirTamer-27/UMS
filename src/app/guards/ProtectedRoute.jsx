import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";

import Box from "@mui/material/Box";
import CircularProgress from "@mui/material/CircularProgress";

import { supabase } from "../../services/supabase";

const ProtectedRoute = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const checkUser = async () => {
      if (!supabase) {
        if (isMounted) {
          setUser(null);
          setLoading(false);
        }
        return;
      }

      const {
        data: { user: currentUser },
        error,
      } = await supabase.auth.getUser();

      if (isMounted) {
        setUser(error ? null : currentUser);
        setLoading(false);
      }
    };

    checkUser();

    return () => {
      isMounted = false;
    };
  }, []);

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

  return user ? children : <Navigate replace to="/login" />;
};

export default ProtectedRoute;

<<<<<<< Updated upstream
import CssBaseline from "@mui/material/CssBaseline";
import { createTheme, ThemeProvider } from "@mui/material/styles";

import { AppRouter } from "./app/router";
import { AuthProvider } from "./context/AuthContext";

const theme = createTheme({
  palette: {
    primary: {
      main: "#1E3A8A",
      dark: "#172F73",
    },
    secondary: {
      main: "#0F766E",
    },
    warning: {
      main: "#F59E0B",
    },
    background: {
      default: "#F8FAFC",
      paper: "#FFFFFF",
    },
    text: {
      primary: "#0F172A",
      secondary: "#475569",
    },
    divider: "#E2E8F0",
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Arial", sans-serif',
    allVariants: {
      letterSpacing: 0,
    },
  },
  shape: {
    borderRadius: 8,
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: "none",
        },
      },
    },
    MuiTextField: {
      defaultProps: {
        variant: "outlined",
      },
    },
  },
});

const App = () => (
  <ThemeProvider theme={theme}>
    <CssBaseline />
    <AuthProvider>
      <AppRouter />
    </AuthProvider>
  </ThemeProvider>
);
=======
import Dashboard from "./app/Dashboard";

function App() {
  return <Dashboard />;
}
>>>>>>> Stashed changes

export default App;
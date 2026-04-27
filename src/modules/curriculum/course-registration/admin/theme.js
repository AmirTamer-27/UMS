import { createTheme } from '@mui/material/styles';

const palette = {
  primary: {
    main: '#1E3A8A',
  },
  secondary: {
    main: '#0F766E',
  },
  background: {
    default: '#F8FAFC',
    paper: '#FFFFFF',
  },
  accent: {
    main: '#F59E0B',
  },
  divider: '#E2E8F0',
};

const typography = {
  fontFamily: 'Inter, Roboto, Arial, sans-serif',
  h1: { color: '#0F172A' },
  h2: { color: '#0F172A' },
  h3: { color: '#0F172A' },
  body1: { color: '#0F172A' },
  body2: { color: '#475569' },
};

const theme = createTheme({
  palette,
  typography,
  shape: { borderRadius: 8 },
  components: {
    MuiButton: {
      defaultProps: { disableElevation: true },
    },
    MuiPaper: {
      styleOverrides: { root: { backgroundColor: palette.background.paper } },
    },
  },
});

export default theme;

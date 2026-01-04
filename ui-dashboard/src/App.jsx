import { useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { CssBaseline, ThemeProvider, createTheme, Box } from '@mui/material';
import Navbar from './components/Navbar';
import Sidebar, { DRAWER_WIDTH } from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import Trips from './pages/Trips';
import TripDetail from './pages/TripDetail';
import Inventory from './pages/Inventory';
import AIAnalysis from './pages/AIAnalysis';
import Settings from './pages/Settings';
import './App.css';

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#EB8C00', // Tangerine/Orange
      light: '#F5A623',
      dark: '#D67800',
    },
    secondary: {
      main: '#FFB600', // Yellow
      light: '#FFD54F',
      dark: '#E0A000',
    },
    success: {
      main: '#10b981',
    },
    warning: {
      main: '#F59E0B',
    },
    error: {
      main: '#E0301E', // Red
    },
    info: {
      main: '#EB8C00',
    },
    background: {
      default: '#FFFFFF', // White background
      paper: '#F9F9F9', // Very light grey paper
    },
    text: {
      primary: '#000000', // Black text
      secondary: '#464646', // Medium Grey
    },
  },
  typography: {
    fontFamily: '"Segoe UI", "Roboto", "Helvetica", "Arial", sans-serif',
    h4: {
      fontWeight: 700,
      letterSpacing: '0.3px',
      color: '#000000',
    },
    h6: {
      fontWeight: 600,
      color: '#2D2D2D',
    },
    h5: {
      fontWeight: 700,
      color: '#000000',
    },
    body1: {
      color: '#2D2D2D',
    },
    body2: {
      color: '#464646',
    },
    button: {
      textTransform: 'none',
      fontWeight: 600,
      letterSpacing: '0.3px',
    },
  },
  components: {
    MuiTableCell: {
      styleOverrides: {
        head: {
          backgroundColor: '#F9F9F9',
          fontWeight: 700,
          color: '#EB8C00',
          borderColor: '#DEDEDE',
          paddingTop: '12px',
          paddingBottom: '12px',
        },
        body: {
          color: '#2D2D2D',
          borderColor: '#F0F0F0',
          paddingTop: '10px',
          paddingBottom: '10px',
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 600,
          borderRadius: '8px',
          boxShadow: 'none',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        },
        contained: {
          backgroundColor: '#EB8C00',
          color: '#FFFFFF',
          '&:hover': {
            backgroundColor: '#D67800',
            boxShadow: '0 4px 12px rgba(235, 140, 0, 0.3)',
            transform: 'translateY(-2px)',
          },
        },
        outlined: {
          borderColor: '#EB8C00',
          color: '#EB8C00',
          '&:hover': {
            borderColor: '#D67800',
            backgroundColor: 'rgba(235, 140, 0, 0.05)',
          },
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          fontWeight: 600,
          borderRadius: '6px',
        },
        filled: {
          backgroundColor: '#F0F0F0',
          color: '#2D2D2D',
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: '12px',
          backgroundColor: '#FFFFFF',
          border: '1px solid #DEDEDE',
          boxShadow: '0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          '&:hover': {
            boxShadow: '0 4px 12px rgba(235, 140, 0, 0.12)',
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: '12px',
          backgroundColor: '#F9F9F9',
          border: '1px solid #DEDEDE',
          boxShadow: '0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)',
        },
      },
    },
  },
});

function App() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <Box sx={{ display: 'flex', minHeight: '100vh' }}>
          {/* Navbar */}
          <Navbar onMenuToggle={() => setSidebarOpen(!sidebarOpen)} />

          {/* Sidebar */}
          <Sidebar
            open={sidebarOpen}
            onClose={() => setSidebarOpen(false)}
          />

          {/* Main Content */}
          <Box
            sx={{
              flex: 1,
              mt: '64px',
              ml: { xs: 0, md: 0 },
              backgroundColor: '#FFFFFF',
              minHeight: 'calc(100vh - 64px)',
            }}
          >
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/trips" element={<Trips />} />
              <Route path="/trip/:tripId" element={<TripDetail />} />
              <Route path="/inventory" element={<Inventory />} />
              <Route path="/ai-analysis" element={<AIAnalysis />} />
              <Route path="/settings" element={<Settings />} />
            </Routes>
          </Box>
        </Box>
      </Router>
    </ThemeProvider>
  );
}

export default App;

import React from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  Box,
  IconButton,
  Menu,
  MenuItem,
  Badge,
} from '@mui/material';
import {
  Menu as MenuIcon,
  AccountCircle,
  Notifications,
  Search as SearchIcon,
} from '@mui/icons-material';

const Navbar = ({ onMenuToggle }) => {
  const [anchorEl, setAnchorEl] = React.useState(null);

  const handleMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  return (
    <AppBar
      position="fixed"
      sx={{
        zIndex: 1300,
        backgroundColor: '#EB8C00', // Tangerine/Orange
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        width: '100%',
        borderRadius: '0',
      }}
    >
      <Toolbar sx={{ justifyContent: 'center', position: 'relative' }}>
        {/* Menu toggle button - left aligned */}
        <IconButton
          color="inherit"
          aria-label="menu"
          onClick={onMenuToggle}
          sx={{
            position: 'absolute',
            left: 16,
          }}
        >
          <MenuIcon />
        </IconButton>

        {/* Centered Branding */}
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <Typography
              variant="h6"
              component="div"
              sx={{
                fontWeight: 700,
                fontSize: '1.3rem',
                letterSpacing: '0.5px',
                color: '#FFFFFF',
              }}
            >
              ⚡ AutoPulse
            </Typography>
            <Typography
              variant="caption"
              sx={{
                fontSize: '0.7rem',
                fontStyle: 'italic',
                color: 'rgba(255,255,255,0.9)',
                lineHeight: 1,
              }}
            >
              The real-time heartbeat of supply chains
            </Typography>
        </Box>

        {/* Right-aligned controls */}
        <Box sx={{ position: 'absolute', right: 16, display: 'flex', alignItems: 'center', gap: 1 }}>
          <IconButton color="inherit" size="large">
            <SearchIcon />
          </IconButton>
          <IconButton color="inherit" size="large">
            <Badge badgeContent={4} color="error">
              <Notifications />
            </Badge>
          </IconButton>
          <IconButton
            color="inherit"
            onClick={handleMenuOpen}
            sx={{ ml: 1 }}
          >
            <AccountCircle />
          </IconButton>
          <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={handleMenuClose}
            anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            transformOrigin={{ vertical: 'top', horizontal: 'right' }}
          >
            <MenuItem onClick={handleMenuClose}>👤 Profile</MenuItem>
            <MenuItem onClick={handleMenuClose}>⚙️ Settings</MenuItem>
            <MenuItem onClick={handleMenuClose}>🚪 Logout</MenuItem>
          </Menu>
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default Navbar;

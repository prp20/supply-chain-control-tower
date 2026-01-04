import React, { useState } from 'react';
import {
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Divider,
  Box,
  useTheme,
  useMediaQuery,
  Typography,
  Tooltip,
} from '@mui/material';
import {
  Dashboard,
  LocalShipping,
  Inventory,
  SmartToy,
  Settings,
  Home,
  ChevronLeft,
  ChevronRight,
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';

const DRAWER_WIDTH = 280;
const COLLAPSED_WIDTH = 80;

const Sidebar = ({ open, onClose }) => {
  const [collapsed, setCollapsed] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const menuItems = [
    { label: 'Dashboard', icon: <Dashboard />, path: '/' },
    { label: 'Trips', icon: <LocalShipping />, path: '/trips' },
    { label: 'Inventory', icon: <Inventory />, path: '/inventory' },
    { label: 'AI Analysis', icon: <SmartToy />, path: '/ai-analysis' },
  ];

  const settingsItems = [
    { label: 'Settings', icon: <Settings />, path: '/settings' },
  ];

  const handleNavigate = (path) => {
    navigate(path);
    if (isMobile && onClose) {
      onClose();
    }
  };

  const isActive = (path) => location.pathname === path;

  const drawerContent = (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Logo Section */}
      <Box
        sx={{
          p: collapsed ? 1.5 : 2.5,
          background: '#EB8C00', // Tangerine/Orange
          color: '#FFFFFF',
          textAlign: 'center',
          borderRadius: '0',
          overflow: 'hidden',
          minHeight: collapsed ? 80 : 'auto',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: collapsed ? 0 : 1 }}>
          <Tooltip title={collapsed ? 'AutoPulse' : ''} placement="right">
            <Home sx={{ fontSize: 28 }} />
          </Tooltip>
          {!collapsed && (
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
              <Typography variant="h6" sx={{ fontWeight: 700, lineHeight: 1.2 }}>
                AutoPulse
              </Typography>
              <Typography variant="caption" sx={{ fontSize: '0.65rem', opacity: 0.95, fontStyle: 'italic' }}>
                Supply Chain OS
              </Typography>
            </Box>
          )}
        </Box>
      </Box>

      <Divider />

      {/* Main Menu */}
      <List sx={{ flex: 1, pt: 2, px: collapsed ? 0.5 : 1 }}>
        {menuItems.map((item) => (
          <ListItem key={item.path} disablePadding sx={{ mb: 0.5, justifyContent: collapsed ? 'center' : 'flex-start' }}>
            <Tooltip title={collapsed ? item.label : ''} placement="right">
              <ListItemButton
                selected={isActive(item.path)}
                onClick={() => handleNavigate(item.path)}
                sx={{
                  borderRadius: '0',
                  mb: 0.5,
                  justifyContent: collapsed ? 'center' : 'flex-start',
                  px: collapsed ? 1 : 2,
                  '&.Mui-selected': {
                    backgroundColor: 'rgba(235, 140, 0, 0.15)',
                    color: '#EB8C00',
                    '& .MuiListItemIcon-root': {
                      color: '#EB8C00',
                    },
                    fontWeight: 600,
                    borderLeft: collapsed ? 'none' : '4px solid #EB8C00',
                    paddingLeft: collapsed ? 'auto' : 'calc(16px - 4px)',
                  },
                  '&:hover': {
                    backgroundColor: 'rgba(235, 140, 0, 0.08)',
                  },
                  transition: 'all 0.3s ease',
                }}
              >
                <ListItemIcon
                  sx={{
                    minWidth: collapsed ? 'auto' : 40,
                    color: isActive(item.path) ? '#EB8C00' : 'inherit',
                    justifyContent: 'center',
                  }}
                >
                  {item.icon}
                </ListItemIcon>
                {!collapsed && (
                  <ListItemText
                    primary={item.label}
                    primaryTypographyProps={{
                      variant: 'body2',
                      fontWeight: isActive(item.path) ? 600 : 500,
                    }}
                  />
                )}
              </ListItemButton>
            </Tooltip>
          </ListItem>
        ))}
      </List>

      <Divider sx={{ my: 2 }} />

      {/* Settings Menu */}
      <List sx={{ px: collapsed ? 0.5 : 1, pb: 2 }}>
        {settingsItems.map((item) => (
          <ListItem key={item.path} disablePadding sx={{ mb: 0.5, justifyContent: collapsed ? 'center' : 'flex-start' }}>
            <Tooltip title={collapsed ? item.label : ''} placement="right">
              <ListItemButton
                selected={isActive(item.path)}
                onClick={() => handleNavigate(item.path)}
                sx={{
                  borderRadius: '0',
                  justifyContent: collapsed ? 'center' : 'flex-start',
                  px: collapsed ? 1 : 2,
                  '&.Mui-selected': {
                    backgroundColor: 'rgba(235, 140, 0, 0.15)',
                    color: '#EB8C00',
                    '& .MuiListItemIcon-root': {
                      color: '#EB8C00',
                    },
                    fontWeight: 600,
                    borderLeft: collapsed ? 'none' : '4px solid #EB8C00',
                    paddingLeft: collapsed ? 'auto' : 'calc(16px - 4px)',
                  },
                  '&:hover': {
                    backgroundColor: 'rgba(235, 140, 0, 0.08)',
                  },
                  transition: 'all 0.3s ease',
                }}
              >
                <ListItemIcon
                  sx={{
                    minWidth: collapsed ? 'auto' : 40,
                    color: isActive(item.path) ? '#EB8C00' : 'inherit',
                    justifyContent: 'center',
                  }}
                >
                  {item.icon}
                </ListItemIcon>
                {!collapsed && (
                  <ListItemText
                    primary={item.label}
                    primaryTypographyProps={{
                      variant: 'body2',
                      fontWeight: isActive(item.path) ? 600 : 500,
                    }}
                  />
                )}
              </ListItemButton>
            </Tooltip>
          </ListItem>
        ))}

        {/* Collapse Toggle Button - Desktop only */}
        <Divider sx={{ my: 1 }} />
        <ListItem disablePadding sx={{ display: { xs: 'none', md: 'block' }, justifyContent: collapsed ? 'center' : 'flex-start' }}>
          <Tooltip title={collapsed ? 'Expand' : 'Collapse'} placement="right">
            <ListItemButton
              onClick={() => setCollapsed(!collapsed)}
              sx={{
                borderRadius: '0',
                justifyContent: collapsed ? 'center' : 'flex-start',
                px: collapsed ? 1 : 2,
                '&:hover': {
                  backgroundColor: 'rgba(0, 0, 0, 0.04)',
                },
              }}
            >
              <ListItemIcon
                sx={{
                  minWidth: collapsed ? 'auto' : 40,
                  justifyContent: 'center',
                  color: '#666',
                }}
              >
                {collapsed ? <ChevronRight fontSize="small" /> : <ChevronLeft fontSize="small" />}
              </ListItemIcon>
            </ListItemButton>
          </Tooltip>
        </ListItem>
      </List>
    </Box>
  );

  return (
    <>
      {/* Mobile drawer */}
      <Drawer
        anchor="left"
        open={open}
        onClose={onClose}
        sx={{
          display: { xs: 'block', md: 'none' },
          '& .MuiDrawer-paper': {
            width: collapsed ? COLLAPSED_WIDTH : DRAWER_WIDTH,
            boxSizing: 'border-box',
            zIndex: 1400,
            transition: 'width 0.3s ease',
          },
        }}
      >
        {drawerContent}
      </Drawer>

      {/* Desktop drawer - now collapsible and spans over navbar */}
      <Drawer
        anchor="left"
        variant="temporary"
        open={open}
        onClose={onClose}
        sx={{
          display: { xs: 'none', md: 'block' },
          '& .MuiDrawer-paper': {
            width: collapsed ? COLLAPSED_WIDTH : DRAWER_WIDTH,
            boxSizing: 'border-box',
            zIndex: 1400,
            borderRight: '1px solid #f0f0f0',
            transition: 'width 0.3s ease',
          },
        }}
      >
        {drawerContent}
      </Drawer>
    </>
  );
};

export { DRAWER_WIDTH };
export default Sidebar;

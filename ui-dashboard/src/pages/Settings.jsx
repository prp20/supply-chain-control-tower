import React, { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Switch,
  FormControlLabel,
  Divider,
  Card,
  CardContent,
  Alert,
  Grid,
} from '@mui/material';
import { Save, Refresh, CheckCircle } from '@mui/icons-material';

const Settings = () => {
  const [settings, setSettings] = useState({
    apiUrl: 'http://localhost:8000',
    refreshInterval: 30,
    notifications: true,
    darkMode: false,
    autoUpdate: true,
  });

  const [saved, setSaved] = useState(false);

  const handleChange = (field, value) => {
    setSettings((prev) => ({
      ...prev,
      [field]: value,
    }));
    setSaved(false);
  };

  const handleSave = () => {
    localStorage.setItem('appSettings', JSON.stringify(settings));
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const handleReset = () => {
    setSettings({
      apiUrl: 'http://localhost:8000',
      refreshInterval: 30,
      notifications: true,
      darkMode: false,
      autoUpdate: true,
    });
  };

  return (
    <Box sx={{ p: 0, height: '100%', display: 'flex', flexDirection: 'column', bgcolor: 'background.default' }}>
      {/* Header Section */}
      <Box sx={{ p: 4, pb: 3, borderBottom: '1px solid', borderColor: '#2a3142' }}>
        <Typography variant="h4" sx={{ fontWeight: 700, mb: 0.5 }}>
          ⚙️ Settings
        </Typography>
        <Typography color="textSecondary" variant="body2">
          Manage your application configuration and preferences
        </Typography>
      </Box>

      {/* Scrollable Content */}
      <Box sx={{ flex: 1, overflow: 'auto', p: 4, display: 'flex', flexDirection: 'column', gap: 3 }}>
        {saved && (
        <Alert
          severity="success"
          icon={<CheckCircle />}
          sx={{
            mb: 3,
            backgroundColor: '#43e97b20',
            borderColor: '#43e97b',
            color: '#43e97b',
            fontWeight: 600,
          }}
        >
          Settings saved successfully!
        </Alert>
      )}

        <Grid container spacing={3}>
        {/* API Configuration */}
        <Grid item xs={12} md={8}>
          <Card
            sx={{
              mb: 3,
              background: '#1a1f2e',
              border: '1px solid #2a3142',
            }}
          >
            <CardContent>
              <Typography variant="h6" sx={{ mb: 3, fontWeight: 700, color: '#667eea' }}>
                🔌 API Configuration
              </Typography>
              <Divider sx={{ mb: 3 }} />
              <TextField
                fullWidth
                label="API Gateway URL"
                value={settings.apiUrl}
                onChange={(e) => handleChange('apiUrl', e.target.value)}
                placeholder="http://localhost:8000"
                sx={{ mb: 2 }}
                helperText="Base URL for the API Gateway service"
              />
              <TextField
                fullWidth
                type="number"
                label="Refresh Interval (seconds)"
                value={settings.refreshInterval}
                onChange={(e) =>
                  handleChange('refreshInterval', parseInt(e.target.value))
                }
                inputProps={{ min: 5, max: 300 }}
                helperText="How often to refresh data from the server"
              />
            </CardContent>
          </Card>

          {/* Features */}
          <Card
            sx={{
              mb: 3,
              background: '#1a1f2e',
              border: '1px solid #2a3142',
            }}
          >
            <CardContent>
              <Typography variant="h6" sx={{ mb: 3, fontWeight: 700, color: '#667eea' }}>
                🎯 Features
              </Typography>
              <Divider sx={{ mb: 3 }} />
              <FormControlLabel
                control={
                  <Switch
                    checked={settings.notifications}
                    onChange={(e) =>
                      handleChange('notifications', e.target.checked)
                    }
                  />
                }
                label="Enable Notifications"
                sx={{ display: 'block', mb: 2 }}
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={settings.autoUpdate}
                    onChange={(e) =>
                      handleChange('autoUpdate', e.target.checked)
                    }
                  />
                }
                label="Auto-update Data"
                sx={{ display: 'block', mb: 2 }}
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={settings.darkMode}
                    onChange={(e) => handleChange('darkMode', e.target.checked)}
                    disabled
                  />
                }
                label="Dark Mode (Coming Soon)"
                sx={{ display: 'block' }}
              />
            </CardContent>
          </Card>

          {/* Actions */}
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button
              variant="contained"
              startIcon={<Save />}
              onClick={handleSave}
              sx={{
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                fontWeight: 700,
              }}
            >
              Save Settings
            </Button>
            <Button
              variant="outlined"
              startIcon={<Refresh />}
              onClick={handleReset}
              sx={{
                color: '#667eea',
                borderColor: '#667eea',
                fontWeight: 700,
              }}
            >
              Reset to Defaults
            </Button>
          </Box>
        </Grid>

        {/* Info Section */}
        <Grid item xs={12} md={4}>
          <Card
            sx={{
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
              mb: 2,
            }}
          >
            <CardContent>
              <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>
                ℹ️ About
              </Typography>
              <Typography variant="body2" sx={{ mb: 1, opacity: 0.9 }}>
                <strong>Supply Chain Dashboard v1.0</strong>
              </Typography>
              <Typography variant="body2" sx={{ mb: 1, opacity: 0.9 }}>
                Built with React, Vite, and Material-UI
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.8 }}>
                © 2026 Supply Chain Management. All rights reserved.
              </Typography>
            </CardContent>
          </Card>

          <Card
            sx={{
              background: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
              color: 'white',
            }}
          >
            <CardContent>
              <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>
                ✨ Features
              </Typography>
              <Typography variant="body2" sx={{ mb: 1, opacity: 0.9 }}>
                ✓ Real-time monitoring
              </Typography>
              <Typography variant="body2" sx={{ mb: 1, opacity: 0.9 }}>
                ✓ Interactive maps
              </Typography>
              <Typography variant="body2" sx={{ mb: 1, opacity: 0.9 }}>
                ✓ AI insights
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.9 }}>
                ✓ Responsive design
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
      </Box>
    </Box>
  );
};

export default Settings;

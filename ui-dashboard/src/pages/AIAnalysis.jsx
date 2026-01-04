import React, { useState } from 'react';
import {
  Box,
  Grid,
  Paper,
  Typography,
  Card,
  CardContent,
  Button,
  TextField,
  Alert,
  CircularProgress,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Chip,
} from '@mui/material';
import {
  TrendingUp,
  WarningAmber,
  CheckCircle,
  Lightbulb,
  Psychology,
  Send as SendIcon,
} from '@mui/icons-material';

const InsightCard = ({ icon: Icon, title, description, severity = 'info' }) => {
  const severityColor = {
    info: '#4facfe',
    warning: '#fa709a',
    success: '#43e97b',
    error: '#ff6b6b',
  };

  return (
    <Card
      sx={{
        mb: 2,
        background: '#F9F9F9',
        border: '1px solid #DEDEDE',
        transition: 'all 0.3s ease',
        '&:hover': {
          boxShadow: '0 8px 16px rgba(102, 126, 234, 0.2)',
          transform: 'translateY(-2px)',
          borderColor: severityColor[severity],
        },
      }}
    >
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'start', gap: 2 }}>
          <Icon
            sx={{
              mt: 1,
              color: severityColor[severity],
              fontSize: 28,
            }}
          />
          <Box sx={{ flex: 1 }}>
            <Typography variant="h6" sx={{ fontWeight: 700, mb: 0.5, color: '#000000' }}>
              {title}
            </Typography>
            <Typography color="textSecondary" variant="body2" sx={{ mb: 1 }}>
              {description}
            </Typography>
            <Chip
              label={severity.charAt(0).toUpperCase() + severity.slice(1)}
              size="small"
              sx={{
                backgroundColor: `${severityColor[severity]}20`,
                color: severityColor[severity],
                fontWeight: 600,
                border: `1px solid ${severityColor[severity]}`,
              }}
            />
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
};

const AIAnalysis = () => {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [analysisResults, setAnalysisResults] = useState(null);

  const handleAnalyze = async () => {
    if (!query.trim()) return;

    setLoading(true);
    setTimeout(() => {
      setAnalysisResults({
        query,
        insights: [
          {
            title: 'Route Optimization',
            description: 'Current routes can be optimized by 15% to reduce delivery time and fuel costs.',
            severity: 'success',
            icon: TrendingUp,
          },
          {
            title: 'Inventory Alert',
            description: '3 items are approaching minimum stock levels. Recommend immediate restocking.',
            severity: 'warning',
            icon: WarningAmber,
          },
          {
            title: 'Fleet Status',
            description:
              'All vehicles are operating normally. Maintenance scheduled for 2 vehicles next week.',
            severity: 'info',
            icon: CheckCircle,
          },
          {
            title: 'Demand Forecast',
            description: 'Predicted 20% increase in demand next month. Recommend pre-positioning inventory.',
            severity: 'info',
            icon: Lightbulb,
          },
        ],
        recommendations: [
          'Increase inventory levels for high-demand items',
          'Schedule route optimization updates',
          'Review vendor performance metrics',
          'Plan maintenance windows for fleet',
          'Analyze customer demand patterns',
        ],
      });
      setLoading(false);
    }, 2000);
  };

  return (
    <Box sx={{ p: 0, height: '100%', display: 'flex', flexDirection: 'column', bgcolor: 'background.default' }}>
      {/* Header Section */}
      <Box sx={{ p: 4, pb: 3, borderBottom: '1px solid', borderColor: '#DEDEDE' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
          <Psychology sx={{ fontSize: 32, color: '#667eea' }} />
          <Typography variant="h4" sx={{ fontWeight: 700 }}>
            AI-Powered Analysis
          </Typography>
        </Box>
        <Typography color="textSecondary" variant="body2">
          Get intelligent insights about your supply chain operations
        </Typography>
      </Box>

      {/* Scrollable Content */}
      <Box sx={{ flex: 1, overflow: 'auto', p: 4, display: 'flex', flexDirection: 'column' }}>
        <Grid container spacing={4} sx={{ height: 'fit-content' }}>
          {/* Query Section - Left Sidebar */}
          <Grid item xs={12} lg={5} xl={4}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              {/* Query Input Panel */}
              <Paper
                sx={{
                  p: 3,
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  color: 'white',
                  borderRadius: 2,
                }}
              >
                <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2.5 }}>
                  Ask AI Assistant
                </Typography>
                <TextField
                  fullWidth
                  multiline
                  rows={5}
                  placeholder="Ask a question about your supply chain..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  disabled={loading}
                  sx={{
                    mb: 2,
                    '& .MuiOutlinedInput-root': {
                      backgroundColor: 'white',
                      color: '#333',
                    },
                    '& .MuiOutlinedInput-input::placeholder': {
                      opacity: 0.7,
                    },
                  }}
                />
                <Button
                  fullWidth
                  variant="contained"
                  onClick={handleAnalyze}
                  disabled={!query.trim() || loading}
                  endIcon={loading ? <CircularProgress size={20} /> : <SendIcon />}
                  sx={{
                    backgroundColor: 'white',
                    color: '#667eea',
                    fontWeight: 700,
                    '&:hover': {
                      backgroundColor: '#f0f0f0',
                    },
                    '&:disabled': {
                      backgroundColor: 'rgba(255,255,255,0.5)',
                      color: 'rgba(102,126,234,0.5)',
                    },
                  }}
                >
                  {loading ? 'Analyzing...' : 'Analyze'}
                </Button>
              </Paper>

              {/* Quick Queries */}
              <Paper sx={{ p: 3, background: '#F9F9F9', border: '1px solid #DEDEDE' }}>
                <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 700, color: '#667eea' }}>
                  💡 Quick Queries
                </Typography>
                <Button
                  fullWidth
                  variant="text"
                  size="small"
                  onClick={() => {
                    setQuery('What routes need optimization?');
                    setTimeout(() => handleAnalyze(), 100);
                  }}
                  sx={{
                    justifyContent: 'flex-start',
                    mb: 1,
                    color: '#667eea',
                    fontWeight: 600,
                    '&:hover': { backgroundColor: 'rgba(102, 126, 234, 0.1)' },
                  }}
                >
                  → What routes need optimization?
                </Button>
                <Button
                  fullWidth
                  variant="text"
                  size="small"
                  onClick={() => {
                    setQuery('Which items are low in stock?');
                    setTimeout(() => handleAnalyze(), 100);
                  }}
                  sx={{
                    justifyContent: 'flex-start',
                    mb: 1,
                    color: '#667eea',
                    fontWeight: 600,
                    '&:hover': { backgroundColor: 'rgba(102, 126, 234, 0.1)' },
                  }}
                >
                  → Which items are low in stock?
                </Button>
                <Button
                  fullWidth
                  variant="text"
                  size="small"
                  onClick={() => {
                    setQuery('What is the fleet status?');
                    setTimeout(() => handleAnalyze(), 100);
                  }}
                  sx={{
                    justifyContent: 'flex-start',
                    color: '#667eea',
                    fontWeight: 600,
                    '&:hover': { backgroundColor: 'rgba(102, 126, 234, 0.1)' },
                  }}
                >
                  → What is the fleet status?
                </Button>
              </Paper>
            </Box>
          </Grid>

          {/* Results Section - Right Main Area */}
          <Grid item xs={12} lg={7} xl={8}>
            {!analysisResults ? (
              <Paper
                sx={{
                  p: 5,
                  textAlign: 'center',
                  background: '#F9F9F9',
                  border: '2px dashed #DEDEDE',
                  borderRadius: 2,
                  minHeight: '400px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Box>
                  <Lightbulb
                    sx={{
                      fontSize: 80,
                      color: '#667eea',
                      opacity: 0.2,
                      mb: 2,
                    }}
                  />
                  <Typography color="textSecondary" sx={{ fontSize: '1.1rem' }}>
                    Ask a question to get AI-powered insights
                  </Typography>
                </Box>
              </Paper>
            ) : (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                <Alert
                  severity="info"
                  sx={{
                    backgroundColor: '#667eea20',
                    borderColor: '#667eea',
                    color: '#667eea',
                    fontWeight: 600,
                  }}
                >
                  Analysis for: <strong>"{analysisResults.query}"</strong>
                </Alert>

                <Box>
                  <Typography variant="h6" sx={{ mb: 2.5, fontWeight: 700, color: '#667eea' }}>
                    📊 Key Insights
                  </Typography>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    {analysisResults.insights.map((insight, idx) => (
                      <InsightCard
                        key={idx}
                        icon={insight.icon}
                        title={insight.title}
                        description={insight.description}
                        severity={insight.severity}
                      />
                    ))}
                  </Box>
                </Box>

                <Box>
                  <Typography variant="h6" sx={{ mb: 2.5, fontWeight: 700, color: '#667eea' }}>
                    ✅ Recommendations
                  </Typography>
                  <Paper sx={{ background: '#F9F9F9', border: '1px solid #DEDEDE' }}>
                    <CardContent>
                      <List sx={{ p: 0 }}>
                        {analysisResults.recommendations.map((rec, idx) => (
                          <ListItem key={idx} sx={{ py: 1.5, px: 0 }}>
                            <ListItemIcon sx={{ minWidth: 32 }}>
                              <CheckCircle sx={{ color: '#43e97b', fontSize: 20 }} />
                            </ListItemIcon>
                            <ListItemText
                              primary={rec}
                              primaryTypographyProps={{ fontWeight: 500, color: '#000000' }}
                            />
                          </ListItem>
                        ))}
                      </List>
                    </CardContent>
                  </Paper>
                </Box>

                <Button
                  fullWidth
                  variant="outlined"
                  sx={{
                    color: '#667eea',
                    borderColor: '#667eea',
                    fontWeight: 600,
                    '&:hover': {
                      backgroundColor: 'rgba(102, 126, 234, 0.1)',
                      borderColor: '#764ba2',
                    },
                  }}
                  onClick={() => {
                    setAnalysisResults(null);
                    setQuery('');
                  }}
                >
                  New Analysis
                </Button>
              </Box>
            )}
          </Grid>
        </Grid>
      </Box>
    </Box>
  );
};

export default AIAnalysis;

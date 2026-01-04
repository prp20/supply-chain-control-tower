import React from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Chip,
  Button,
  Divider,
  Paper,
  LinearProgress,
  Grid,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
} from '@mui/material';
import {
  Close as CloseIcon,
  CheckCircle,
  Lightbulb,
  TrendingUp,
  Psychology,
} from '@mui/icons-material';

/**
 * Enhanced "Why" Panel - Detailed Decision Explanation Modal
 * Shows complete reasoning chain and contributing factors
 *
 * @param {Object} decision - The decision object
 * @param {Object} explanation - The explanation object
 * @param {Function} onClose - Callback when modal closes
 * @param {boolean} isOpen - Whether modal is visible
 */
const WhyPanel = ({ decision, explanation, onClose, isOpen = true }) => {
  if (!isOpen || !decision) {
    return null;
  }

  const getPriorityColor = (priority) => {
    const colors = {
      HIGH: { bg: '#ff6b6b', fg: 'white' },
      MEDIUM: { bg: '#ffa94d', fg: 'white' },
      LOW: { bg: '#4facfe', fg: 'white' },
    };
    return colors[priority] || colors.LOW;
  };

  const getTypeDescription = (type) => {
    const descriptions = {
      replenishment: 'Stock needs to be replenished',
      reroute: 'Route optimization recommended',
      alert: 'Supply chain risk detected',
      optimization: 'Operational efficiency improvement',
    };
    return descriptions[type] || 'Decision made';
  };

  return (
    <Box
      sx={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1400,
        p: 2,
        backdropFilter: 'blur(2px)',
        animation: 'fadeIn 0.3s ease-in-out',
        '@keyframes fadeIn': {
          from: { opacity: 0 },
          to: { opacity: 1 },
        },
      }}
      onClick={onClose}
    >
      <Card
        sx={{
          width: '100%',
          maxWidth: 700,
          maxHeight: '90vh',
          overflow: 'auto',
          borderRadius: 2,
          animation: 'slideUp 0.3s ease-in-out',
          '@keyframes slideUp': {
            from: { transform: 'translateY(20px)', opacity: 0 },
            to: { transform: 'translateY(0)', opacity: 1 },
          },
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <Box
          sx={{
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: 'white',
            p: 3,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            gap: 2,
          }}
        >
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
              <Psychology sx={{ fontSize: 24 }} />
              <Typography variant="h6" sx={{ fontWeight: 700 }}>
                Why This Decision?
              </Typography>
            </Box>
            <Typography variant="body2" sx={{ opacity: 0.9 }}>
              {getTypeDescription(decision.type)}
            </Typography>
          </Box>
          <Button
            onClick={onClose}
            sx={{
              color: 'white',
              minWidth: 'auto',
              p: 1,
              '&:hover': {
                backgroundColor: 'rgba(255,255,255,0.2)',
              },
            }}
          >
            <CloseIcon />
          </Button>
        </Box>

        <CardContent sx={{ p: 3 }}>
          {/* Decision Summary */}
          <Box sx={{ mb: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
              <Typography variant="h6" sx={{ fontWeight: 700, color: '#000' }}>
                {decision.action}
              </Typography>
              <Chip
                label={decision.priority}
                size="small"
                sx={{
                  backgroundColor: getPriorityColor(decision.priority).bg,
                  color: getPriorityColor(decision.priority).fg,
                  fontWeight: 700,
                }}
              />
            </Box>

            {/* Explanation Text */}
            <Paper sx={{ background: '#f5f7ff', p: 2, borderLeft: '4px solid #667eea' }}>
              <Typography
                variant="body2"
                sx={{
                  lineHeight: 1.8,
                  color: '#333',
                  whiteSpace: 'pre-wrap',
                }}
              >
                {explanation?.explanation_text || decision.explanation}
              </Typography>
            </Paper>
          </Box>

          <Divider sx={{ my: 3 }} />

          {/* Contributing Signals */}
          <Box sx={{ mb: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
              <Lightbulb sx={{ color: '#ffa94d', fontSize: 22 }} />
              <Typography variant="h6" sx={{ fontWeight: 700, color: '#000' }}>
                Contributing Signals
              </Typography>
            </Box>

            <List sx={{ p: 0 }}>
              {(explanation?.contributing_signals || []).map((signal, idx) => (
                <ListItem
                  key={idx}
                  sx={{
                    py: 1.5,
                    px: 0,
                    borderBottom: idx < (explanation?.contributing_signals?.length - 1) ? '1px solid #eee' : 'none',
                  }}
                >
                  <ListItemIcon sx={{ minWidth: 32 }}>
                    <CheckCircle sx={{ color: '#43e97b', fontSize: 20 }} />
                  </ListItemIcon>
                  <ListItemText
                    primary={signal}
                    primaryTypographyProps={{
                      variant: 'body2',
                      sx: { fontWeight: 500, color: '#333' },
                    }}
                  />
                </ListItem>
              ))}
            </List>
          </Box>

          <Divider sx={{ my: 3 }} />

          {/* Confidence & Metrics */}
          <Grid container spacing={3} sx={{ mb: 3 }}>
            {/* Confidence Score */}
            <Grid item xs={12} sm={6}>
              <Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 600, color: '#000' }}>
                    Confidence Score
                  </Typography>
                  <Typography
                    variant="body2"
                    sx={{
                      fontWeight: 700,
                      color: '#667eea',
                      fontSize: '1.1rem',
                    }}
                  >
                    {(explanation?.confidence * 100 || decision.confidence * 100).toFixed(0)}%
                  </Typography>
                </Box>
                <LinearProgress
                  variant="determinate"
                  value={explanation?.confidence * 100 || decision.confidence * 100}
                  sx={{
                    height: 8,
                    borderRadius: 4,
                    backgroundColor: '#eee',
                    '& .MuiLinearProgress-bar': {
                      background: 'linear-gradient(90deg, #667eea 0%, #764ba2 100%)',
                      borderRadius: 4,
                    },
                  }}
                />
              </Box>
            </Grid>

            {/* Data Source */}
            <Grid item xs={12} sm={6}>
              <Box>
                <Typography variant="subtitle2" sx={{ fontWeight: 600, color: '#000', mb: 1 }}>
                  Data Source
                </Typography>
                <Paper
                  sx={{
                    background: '#f5f7ff',
                    p: 1.5,
                    border: '1px solid #667eea',
                    borderRadius: 1,
                  }}
                >
                  <Typography
                    variant="caption"
                    sx={{
                      fontWeight: 600,
                      color: '#667eea',
                      display: 'block',
                      wordBreak: 'break-word',
                    }}
                  >
                    {decision.data_source}
                  </Typography>
                </Paper>
              </Box>
            </Grid>
          </Grid>

          {/* Signal Count */}
          <Paper
            sx={{
              background: 'linear-gradient(135deg, #667eea15 0%, #764ba215 100%)',
              border: '1px solid #667eea30',
              p: 2,
              borderRadius: 1,
              mb: 2,
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <TrendingUp sx={{ color: '#667eea', fontSize: 24 }} />
              <Box>
                <Typography variant="caption" sx={{ fontWeight: 600, color: '#999', display: 'block' }}>
                  Analysis Depth
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 600, color: '#667eea' }}>
                  {explanation?.contributing_signals?.length || 3} data sources analyzed
                </Typography>
              </Box>
            </Box>
          </Paper>

          {/* Decision ID & Timestamp */}
          <Paper
            sx={{
              background: '#f9f9f9',
              p: 2,
              borderRadius: 1,
              border: '1px solid #eee',
            }}
          >
            <Typography
              variant="caption"
              sx={{
                fontFamily: 'monospace',
                fontSize: '0.75rem',
                color: '#999',
                display: 'block',
                mb: 0.5,
                wordBreak: 'break-all',
              }}
            >
              Decision ID: {decision.decision_id}
            </Typography>
            <Typography
              variant="caption"
              sx={{
                fontFamily: 'monospace',
                fontSize: '0.75rem',
                color: '#999',
              }}
            >
              Timestamp: {new Date(decision.timestamp).toLocaleString()}
            </Typography>
          </Paper>

          {/* Close Button */}
          <Button
            fullWidth
            variant="contained"
            onClick={onClose}
            sx={{
              mt: 3,
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              fontWeight: 600,
              '&:hover': {
                opacity: 0.9,
              },
            }}
          >
            Close
          </Button>
        </CardContent>
      </Card>
    </Box>
  );
};

export default WhyPanel;

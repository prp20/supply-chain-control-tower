import React from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Chip,
  LinearProgress,
  Button,
  Stack,
  Divider,
} from '@mui/material';
import {
  CheckCircle,
  WarningAmber,
  ErrorOutline,
  InfoOutlined,
  TrendingUp,
  Schedule,
} from '@mui/icons-material';

const ExecutiveDecisionCenter = ({ decision, onLearnMore, isLoading }) => {
  if (!decision && !isLoading) {
    return null;
  }

  // Priority styling
  const getPriorityStyle = (priority) => {
    const styles = {
      HIGH: {
        backgroundColor: '#ff6b6b',
        color: 'white',
        icon: ErrorOutline,
      },
      MEDIUM: {
        backgroundColor: '#ffa94d',
        color: 'white',
        icon: WarningAmber,
      },
      LOW: {
        backgroundColor: '#4facfe',
        color: 'white',
        icon: InfoOutlined,
      },
    };
    return styles[priority] || styles.LOW;
  };

  const getDecisionIcon = (type) => {
    const icons = {
      replenishment: TrendingUp,
      reroute: TrendingUp,
      alert: WarningAmber,
      optimization: CheckCircle,
    };
    return icons[type] || CheckCircle;
  };

  if (isLoading) {
    return (
      <Card
        sx={{
          mb: 3,
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white',
          borderRadius: 2,
          overflow: 'hidden',
        }}
      >
        <CardContent>
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
              Loading Latest Decision...
            </Typography>
            <LinearProgress sx={{ my: 2, height: 4, borderRadius: 2 }} />
          </Box>
        </CardContent>
      </Card>
    );
  }

  if (!decision) {
    return (
      <Card
        sx={{
          mb: 3,
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white',
          borderRadius: 2,
          opacity: 0.7,
        }}
      >
        <CardContent>
          <Typography variant="body2" sx={{ textAlign: 'center' }}>
            No active decisions at this time
          </Typography>
        </CardContent>
      </Card>
    );
  }

  const priorityStyle = getPriorityStyle(decision.priority);
  const DecisionIcon = getDecisionIcon(decision.type);
  const PriorityIcon = priorityStyle.icon;

  // Format timestamp
  const formatTime = (isoString) => {
    const date = new Date(isoString);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  return (
    <Card
      sx={{
        mb: 3,
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white',
        borderRadius: 2,
        overflow: 'hidden',
        boxShadow: '0 8px 24px rgba(102, 126, 234, 0.3)',
        transition: 'all 0.3s ease',
        border: `2px solid ${priorityStyle.backgroundColor}`,
        '&:hover': {
          boxShadow: '0 12px 32px rgba(102, 126, 234, 0.4)',
          transform: 'translateY(-2px)',
        },
      }}
    >
      <CardContent>
        {/* Header with Priority Badge */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <DecisionIcon sx={{ fontSize: 32 }} />
            <Box>
              <Typography variant="caption" sx={{ opacity: 0.9, display: 'block', mb: 0.5 }}>
                EXECUTIVE DECISION
              </Typography>
              <Typography
                variant="h6"
                sx={{
                  fontWeight: 700,
                  fontSize: '1.1rem',
                  letterSpacing: '0.5px',
                }}
              >
                {decision.action}
              </Typography>
            </Box>
          </Box>
          <Chip
            icon={<PriorityIcon />}
            label={decision.priority}
            sx={{
              backgroundColor: priorityStyle.backgroundColor,
              color: priorityStyle.color,
              fontWeight: 700,
              fontSize: '0.875rem',
            }}
          />
        </Box>

        <Divider sx={{ my: 2, opacity: 0.3 }} />

        {/* Main Content */}
        <Box sx={{ mb: 2.5 }}>
          <Typography
            variant="body1"
            sx={{
              mb: 2,
              fontSize: '0.95rem',
              lineHeight: 1.6,
              fontWeight: 500,
            }}
          >
            {decision.explanation}
          </Typography>
        </Box>

        {/* Confidence Score */}
        <Box sx={{ mb: 2.5 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
            <Typography variant="caption" sx={{ fontWeight: 600, opacity: 0.95 }}>
              Confidence Score
            </Typography>
            <Typography variant="body2" sx={{ fontWeight: 700, fontSize: '1rem' }}>
              {(decision.confidence * 100).toFixed(0)}%
            </Typography>
          </Box>
          <LinearProgress
            variant="determinate"
            value={decision.confidence * 100}
            sx={{
              height: 8,
              borderRadius: 4,
              backgroundColor: 'rgba(255, 255, 255, 0.2)',
              '& .MuiLinearProgress-bar': {
                background: 'linear-gradient(90deg, #43e97b 0%, #38f9d7 100%)',
                borderRadius: 4,
              },
            }}
          />
        </Box>

        {/* Meta Information */}
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: 2,
            mb: 2.5,
            fontSize: '0.85rem',
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Schedule sx={{ fontSize: 18, opacity: 0.8 }} />
            <Box>
              <Typography variant="caption" sx={{ opacity: 0.8, display: 'block' }}>
                Timestamp
              </Typography>
              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                {formatTime(decision.timestamp)}
              </Typography>
            </Box>
          </Box>
          <Box>
            <Typography variant="caption" sx={{ opacity: 0.8, display: 'block', mb: 0.5 }}>
              Data Source
            </Typography>
            <Typography variant="body2" sx={{ fontWeight: 600 }}>
              {decision.data_source}
            </Typography>
          </Box>
        </Box>

        {/* Action Buttons */}
        <Box sx={{ display: 'flex', gap: 1, pt: 1 }}>
          <Button
            size="small"
            variant="contained"
            sx={{
              backgroundColor: 'rgba(255, 255, 255, 0.3)',
              color: 'white',
              fontWeight: 600,
              '&:hover': {
                backgroundColor: 'rgba(255, 255, 255, 0.5)',
              },
            }}
            onClick={() => onLearnMore && onLearnMore(decision)}
          >
            Learn More
          </Button>
          <Button
            size="small"
            variant="text"
            sx={{
              color: 'white',
              fontWeight: 600,
              '&:hover': {
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
              },
            }}
          >
            View Timeline
          </Button>
        </Box>

        {/* Decision ID */}
        <Typography
          variant="caption"
          sx={{
            display: 'block',
            mt: 1.5,
            opacity: 0.7,
            fontFamily: 'monospace',
            fontSize: '0.75rem',
          }}
        >
          ID: {decision.decision_id}
        </Typography>
      </CardContent>
    </Card>
  );
};

export default ExecutiveDecisionCenter;

import React, { useState, useMemo } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Chip,
  Button,
  Stack,
  Paper,
  Divider,
  IconButton,
  Collapse,
  ButtonGroup,
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  TrendingUp,
  WarningAmber,
  CheckCircle,
  Schedule,
} from '@mui/icons-material';

const DecisionTimeline = ({ decisions = [], onSelectDecision, selectedDecisionId = null }) => {
  const [expandedId, setExpandedId] = useState(null);
  const [filterType, setFilterType] = useState('all');

  // Filter decisions
  const filteredDecisions = useMemo(() => {
    if (filterType === 'all') return decisions;
    return decisions.filter((d) => d.type === filterType);
  }, [decisions, filterType]);

  // Sort by timestamp descending (newest first)
  const sortedDecisions = useMemo(
    () => [...filteredDecisions].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)),
    [filteredDecisions]
  );

  const getTypeIcon = (type) => {
    const icons = {
      replenishment: TrendingUp,
      reroute: TrendingUp,
      alert: WarningAmber,
      optimization: CheckCircle,
    };
    return icons[type] || CheckCircle;
  };

  const getTypeColor = (type) => {
    const colors = {
      replenishment: '#667eea',
      reroute: '#764ba2',
      alert: '#fa709a',
      optimization: '#43e97b',
    };
    return colors[type] || '#667eea';
  };

  const getPriorityColor = (priority) => {
    const colors = {
      HIGH: '#ff6b6b',
      MEDIUM: '#ffa94d',
      LOW: '#4facfe',
    };
    return colors[priority] || '#667eea';
  };

  const formatTime = (isoString) => {
    const date = new Date(isoString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;

    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (sortedDecisions.length === 0) {
    return (
      <Card
        sx={{
          background: '#F9F9F9',
          border: '2px dashed #DEDEDE',
          borderRadius: 2,
          p: 4,
          textAlign: 'center',
        }}
      >
        <Typography color="textSecondary">No decisions yet. Simulate one to get started!</Typography>
      </Card>
    );
  }

  const typeOptions = [
    { label: 'All', value: 'all' },
    { label: 'Replenishment', value: 'replenishment' },
    { label: 'Reroute', value: 'reroute' },
    { label: 'Alert', value: 'alert' },
    { label: 'Optimization', value: 'optimization' },
  ];

  return (
    <Box>
      {/* Filter Buttons */}
      <Box sx={{ mb: 3, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
        <Typography variant="body2" sx={{ fontWeight: 600, display: 'flex', alignItems: 'center' }}>
          Filter:
        </Typography>
        <ButtonGroup size="small" variant="outlined">
          {typeOptions.map((option) => (
            <Button
              key={option.value}
              onClick={() => setFilterType(option.value)}
              variant={filterType === option.value ? 'contained' : 'outlined'}
              sx={{
                color: filterType === option.value ? 'white' : '#667eea',
                borderColor: '#667eea',
                backgroundColor: filterType === option.value ? '#667eea' : 'transparent',
                '&:hover': {
                  backgroundColor: filterType === option.value ? '#5568d3' : 'rgba(102, 126, 234, 0.1)',
                },
              }}
            >
              {option.label}
            </Button>
          ))}
        </ButtonGroup>
        <Typography variant="caption" color="textSecondary" sx={{ ml: 'auto', alignSelf: 'center' }}>
          {sortedDecisions.length} decision{sortedDecisions.length !== 1 ? 's' : ''}
        </Typography>
      </Box>

      {/* Timeline */}
      <Box sx={{ position: 'relative' }}>
        {/* Vertical Line */}
        <Box
          sx={{
            position: 'absolute',
            left: '19px',
            top: 0,
            bottom: 0,
            width: '2px',
            background: 'linear-gradient(to bottom, #667eea, #764ba2)',
            opacity: 0.3,
          }}
        />

        {/* Decision Items */}
        <Stack spacing={2}>
          {sortedDecisions.map((decision, index) => {
            const TypeIcon = getTypeIcon(decision.type);
            const isExpanded = expandedId === decision.decision_id;

            return (
              <Box key={decision.decision_id} sx={{ position: 'relative', pl: 6 }}>
                {/* Timeline Dot */}
                <Box
                  sx={{
                    position: 'absolute',
                    left: 0,
                    top: 12,
                    width: 40,
                    height: 40,
                    borderRadius: '50%',
                    background: getTypeColor(decision.type),
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                    boxShadow: `0 0 0 4px white, 0 0 0 6px ${getTypeColor(decision.type)}`,
                    zIndex: 10,
                  }}
                >
                  <TypeIcon sx={{ fontSize: 20 }} />
                </Box>

                {/* Timeline Card */}
                <Card
                  sx={{
                    borderLeft: `4px solid ${getTypeColor(decision.type)}`,
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    backgroundColor: selectedDecisionId === decision.decision_id ? '#f0f4ff' : '#fff',
                    '&:hover': {
                      boxShadow: '0 8px 16px rgba(102, 126, 234, 0.15)',
                      transform: 'translateX(4px)',
                    },
                  }}
                  onClick={() => {
                    setExpandedId(isExpanded ? null : decision.decision_id);
                    onSelectDecision && onSelectDecision(decision);
                  }}
                >
                  <CardContent sx={{ pb: isExpanded ? 2 : '16px !important' }}>
                    {/* Header */}
                    <Box
                      sx={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'flex-start',
                        gap: 2,
                      }}
                    >
                      <Box sx={{ flex: 1 }}>
                        <Typography variant="h6" sx={{ fontWeight: 700, mb: 0.5, color: '#000' }}>
                          {decision.action}
                        </Typography>
                        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', flexWrap: 'wrap' }}>
                          <Chip
                            label={decision.type.charAt(0).toUpperCase() + decision.type.slice(1)}
                            size="small"
                            sx={{
                              backgroundColor: `${getTypeColor(decision.type)}20`,
                              color: getTypeColor(decision.type),
                              fontWeight: 600,
                              border: `1px solid ${getTypeColor(decision.type)}`,
                            }}
                          />
                          <Chip
                            label={decision.priority}
                            size="small"
                            sx={{
                              backgroundColor: `${getPriorityColor(decision.priority)}20`,
                              color: getPriorityColor(decision.priority),
                              fontWeight: 600,
                              border: `1px solid ${getPriorityColor(decision.priority)}`,
                            }}
                          />
                          <Typography variant="caption" color="textSecondary" sx={{ ml: 'auto' }}>
                            <Schedule sx={{ fontSize: 14, mr: 0.5, verticalAlign: 'middle' }} />
                            {formatTime(decision.timestamp)}
                          </Typography>
                        </Box>
                      </Box>

                      {/* Expand Button */}
                      <IconButton
                        size="small"
                        onClick={(e) => {
                          e.stopPropagation();
                          setExpandedId(isExpanded ? null : decision.decision_id);
                        }}
                        sx={{
                          color: '#667eea',
                          '&:hover': {
                            backgroundColor: 'rgba(102, 126, 234, 0.1)',
                          },
                        }}
                      >
                        {isExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                      </IconButton>
                    </Box>

                    {/* Expandable Details */}
                    <Collapse in={isExpanded} timeout="auto" unmountOnExit>
                      <Box sx={{ mt: 2 }}>
                        <Divider sx={{ mb: 2 }} />

                        {/* Explanation */}
                        <Typography variant="body2" sx={{ mb: 2, color: '#333', lineHeight: 1.6 }}>
                          {decision.explanation}
                        </Typography>

                        {/* Confidence & Source */}
                        <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2, mb: 2 }}>
                          <Box>
                            <Typography variant="caption" sx={{ fontWeight: 600, color: '#999', display: 'block', mb: 0.5 }}>
                              Confidence
                            </Typography>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Typography variant="body2" sx={{ fontWeight: 700, color: '#667eea' }}>
                                {(decision.confidence * 100).toFixed(0)}%
                              </Typography>
                              <Box
                                sx={{
                                  flex: 1,
                                  height: 4,
                                  backgroundColor: '#eee',
                                  borderRadius: 2,
                                  overflow: 'hidden',
                                }}
                              >
                                <Box
                                  sx={{
                                    height: '100%',
                                    width: `${decision.confidence * 100}%`,
                                    background: 'linear-gradient(90deg, #667eea, #764ba2)',
                                  }}
                                />
                              </Box>
                            </Box>
                          </Box>

                          <Box>
                            <Typography variant="caption" sx={{ fontWeight: 600, color: '#999', display: 'block', mb: 0.5 }}>
                              Data Source
                            </Typography>
                            <Typography variant="caption" sx={{ fontWeight: 600, color: '#667eea' }}>
                              {decision.data_source}
                            </Typography>
                          </Box>
                        </Box>

                        {/* Decision ID */}
                        <Typography
                          variant="caption"
                          sx={{
                            fontFamily: 'monospace',
                            fontSize: '0.7rem',
                            color: '#999',
                            display: 'block',
                          }}
                        >
                          ID: {decision.decision_id}
                        </Typography>
                      </Box>
                    </Collapse>
                  </CardContent>
                </Card>
              </Box>
            );
          })}
        </Stack>
      </Box>
    </Box>
  );
};

export default DecisionTimeline;

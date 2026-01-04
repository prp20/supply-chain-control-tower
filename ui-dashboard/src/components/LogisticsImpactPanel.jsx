import React, { useMemo } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  LinearProgress,
  Chip,
  Divider,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Tooltip,
  Paper,
} from '@mui/material';
import {
  LocalShipping,
  StorageOutlined,
  TimerOutlined,
  TrendingDown,
  TrendingUp,
  WarningAmber,
  CheckCircle,
  MoreHoriz,
} from '@mui/icons-material';

/**
 * Logistics Impact Panel
 * Visualizes the operational impact of a decision across logistics dimensions
 *
 * @param {Object} decision - The decision object with type, action, etc.
 * @param {Function} onDrillDown - Callback for drilling into specific metrics
 */
const LogisticsImpactPanel = ({ decision, onDrillDown }) => {
  // Calculate estimated impacts based on decision type
  const impacts = useMemo(() => {
    if (!decision) return null;

    const impactMap = {
      replenishment: {
        title: 'Inventory Replenishment Impact',
        metrics: [
          {
            label: 'Stock Availability',
            change: '+18%',
            current: 65,
            target: 85,
            status: 'improving',
            icon: StorageOutlined,
            details: 'Expected to reach optimal levels in 48 hours',
          },
          {
            label: 'Delivery Times',
            change: '+12%',
            current: 72,
            target: 80,
            status: 'improving',
            icon: TimerOutlined,
            details: 'On-time delivery rate improvement',
          },
          {
            label: 'Fulfillment Cost',
            change: '-8%',
            current: 45,
            target: 52,
            status: 'improving',
            icon: TrendingDown,
            details: 'Reduced expedited shipping needs',
          },
          {
            label: 'Customer Satisfaction',
            change: '+22%',
            current: 58,
            target: 80,
            status: 'improving',
            icon: CheckCircle,
            details: 'Reduced backorders and delays',
          },
        ],
        risks: [
          { label: 'Increased holding costs', severity: 'medium' },
          { label: 'Storage space constraints', severity: 'low' },
        ],
      },
      reroute: {
        title: 'Route Optimization Impact',
        metrics: [
          {
            label: 'Fuel Efficiency',
            change: '-22%',
            current: 78,
            target: 92,
            status: 'improving',
            icon: TrendingDown,
            details: '22% reduction in fuel consumption',
          },
          {
            label: 'Delivery Time',
            change: '-45min',
            current: 55,
            target: 80,
            status: 'improving',
            icon: TimerOutlined,
            details: 'Estimated 45-minute reduction per route',
          },
          {
            label: 'Vehicle Utilization',
            change: '+15%',
            current: 68,
            target: 85,
            status: 'improving',
            icon: LocalShipping,
            details: 'Better capacity utilization',
          },
          {
            label: 'CO2 Emissions',
            change: '-18%',
            current: 72,
            target: 90,
            status: 'improving',
            icon: TrendingDown,
            details: 'Environmental impact reduction',
          },
        ],
        risks: [
          { label: 'Traffic conditions may change', severity: 'medium' },
          { label: 'Driver unfamiliar with new route', severity: 'low' },
        ],
      },
      alert: {
        title: 'Risk Mitigation Impact',
        metrics: [
          {
            label: 'Supply Chain Risk',
            change: '-35%',
            current: 72,
            target: 90,
            status: 'improving',
            icon: WarningAmber,
            details: 'Reduced exposure through backup suppliers',
          },
          {
            label: 'Business Continuity',
            change: '+28%',
            current: 45,
            target: 78,
            status: 'improving',
            icon: CheckCircle,
            details: 'Improved resilience and redundancy',
          },
          {
            label: 'Cost Impact',
            change: '+5%',
            current: 35,
            target: 42,
            status: 'neutral',
            icon: TrendingUp,
            details: 'Short-term cost increase for risk mitigation',
          },
          {
            label: 'Inventory Buffer',
            change: '+12%',
            current: 52,
            target: 68,
            status: 'improving',
            icon: StorageOutlined,
            details: 'Increased safety stock levels',
          },
        ],
        risks: [
          { label: 'Activation of backup suppliers', severity: 'medium' },
          { label: 'Coordination complexity increases', severity: 'medium' },
        ],
      },
      optimization: {
        title: 'Efficiency Optimization Impact',
        metrics: [
          {
            label: 'Operational Cost',
            change: '-12%',
            current: 62,
            target: 85,
            status: 'improving',
            icon: TrendingDown,
            details: 'Cost reduction through consolidation',
          },
          {
            label: 'Processing Time',
            change: '-18%',
            current: 55,
            target: 80,
            status: 'improving',
            icon: TimerOutlined,
            details: 'Faster order processing',
          },
          {
            label: 'Resource Utilization',
            change: '+16%',
            current: 65,
            target: 85,
            status: 'improving',
            icon: LocalShipping,
            details: 'Better asset allocation',
          },
          {
            label: 'Quality Metrics',
            change: '+8%',
            current: 75,
            target: 88,
            status: 'improving',
            icon: CheckCircle,
            details: 'Improved process consistency',
          },
        ],
        risks: [
          { label: 'Implementation complexity', severity: 'medium' },
          { label: 'System reconfiguration needed', severity: 'low' },
        ],
      },
    };

    return impactMap[decision.type] || impactMap.optimization;
  }, [decision]);

  if (!decision || !impacts) {
    return null;
  }

  const getRiskColor = (severity) => {
    const colors = {
      high: '#ff6b6b',
      medium: '#ffa94d',
      low: '#4facfe',
    };
    return colors[severity] || colors.low;
  };

  const getStatusIcon = (status) => {
    if (status === 'improving') return <TrendingUp sx={{ color: '#43e97b', fontSize: 18 }} />;
    return <TrendingDown sx={{ color: '#ffa94d', fontSize: 18 }} />;
  };

  return (
    <Card
      sx={{
        background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
        border: '1px solid #e0e0e0',
        borderRadius: 2,
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
      }}
    >
      <CardContent sx={{ p: 3 }}>
        {/* Header */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" sx={{ fontWeight: 700, color: '#333', mb: 0.5 }}>
            {impacts.title}
          </Typography>
          <Typography variant="caption" color="textSecondary">
            Expected operational outcomes of this decision
          </Typography>
        </Box>

        <Divider sx={{ mb: 3 }} />

        {/* Impact Metrics Grid */}
        <Grid container spacing={2} sx={{ mb: 3 }}>
          {impacts.metrics.map((metric, idx) => {
            const MetricIcon = metric.icon;
            const isPositive = metric.status === 'improving';

            return (
              <Grid item xs={12} sm={6} key={idx}>
                <Tooltip title={metric.details} arrow placement="top">
                  <Paper
                    sx={{
                      p: 2,
                      background: 'white',
                      border: '1px solid #e0e0e0',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      '&:hover': {
                        boxShadow: '0 4px 12px rgba(102, 126, 234, 0.15)',
                        transform: 'translateY(-2px)',
                        borderColor: '#667eea',
                      },
                    }}
                    onClick={() => onDrillDown && onDrillDown(metric)}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <MetricIcon sx={{ color: '#667eea', fontSize: 20 }} />
                        <Typography variant="body2" sx={{ fontWeight: 600, color: '#333' }}>
                          {metric.label}
                        </Typography>
                      </Box>
                      {getStatusIcon(metric.status)}
                    </Box>

                    <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1, mb: 1 }}>
                      <Typography
                        variant="h6"
                        sx={{ fontWeight: 700, color: isPositive ? '#43e97b' : '#ff6b6b' }}
                      >
                        {metric.change}
                      </Typography>
                      <Typography variant="caption" color="textSecondary">
                        expected
                      </Typography>
                    </Box>

                    <Box sx={{ mb: 1 }}>
                      <Box
                        sx={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          mb: 0.5,
                        }}
                      >
                        <Typography variant="caption" sx={{ color: '#666' }}>
                          Current: {metric.current}%
                        </Typography>
                        <Typography variant="caption" sx={{ color: '#667eea', fontWeight: 600 }}>
                          Target: {metric.target}%
                        </Typography>
                      </Box>
                      <LinearProgress
                        variant="determinate"
                        value={metric.current}
                        sx={{
                          height: 6,
                          borderRadius: 3,
                          backgroundColor: '#e0e0e0',
                          '& .MuiLinearProgress-bar': {
                            borderRadius: 3,
                            background: `linear-gradient(90deg, #667eea 0%, #43e97b 100%)`,
                          },
                        }}
                      />
                    </Box>
                  </Paper>
                </Tooltip>
              </Grid>
            );
          })}
        </Grid>

        <Divider sx={{ my: 2 }} />

        {/* Risks Section */}
        <Box>
          <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#333', mb: 1.5 }}>
            Potential Risks & Mitigation
          </Typography>
          <List sx={{ py: 0 }}>
            {impacts.risks.map((risk, idx) => (
              <ListItem key={idx} disableGutters sx={{ py: 0.5 }}>
                <ListItemIcon sx={{ minWidth: 32 }}>
                  <Box
                    sx={{
                      width: 8,
                      height: 8,
                      borderRadius: '50%',
                      backgroundColor: getRiskColor(risk.severity),
                    }}
                  />
                </ListItemIcon>
                <ListItemText
                  primary={
                    <Typography variant="body2" sx={{ color: '#555' }}>
                      {risk.label}
                    </Typography>
                  }
                  secondary={
                    <Chip
                      label={risk.severity.charAt(0).toUpperCase() + risk.severity.slice(1)}
                      size="small"
                      sx={{
                        mt: 0.5,
                        backgroundColor: `${getRiskColor(risk.severity)}15`,
                        color: getRiskColor(risk.severity),
                        fontWeight: 600,
                        border: `1px solid ${getRiskColor(risk.severity)}40`,
                      }}
                    />
                  }
                />
              </ListItem>
            ))}
          </List>
        </Box>

        {/* Summary Stats Footer */}
        <Box
          sx={{
            mt: 2,
            p: 1.5,
            backgroundColor: 'rgba(102, 126, 234, 0.05)',
            borderRadius: 1,
            display: 'flex',
            justifyContent: 'space-around',
            alignItems: 'center',
          }}
        >
          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="caption" color="textSecondary">
              Avg. Improvement
            </Typography>
            <Typography variant="body2" sx={{ fontWeight: 700, color: '#43e97b' }}>
              +18%
            </Typography>
          </Box>
          <Divider orientation="vertical" flexItem />
          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="caption" color="textSecondary">
              Risk Level
            </Typography>
            <Typography variant="body2" sx={{ fontWeight: 700, color: '#ffa94d' }}>
              Medium
            </Typography>
          </Box>
          <Divider orientation="vertical" flexItem />
          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="caption" color="textSecondary">
              Implementation
            </Typography>
            <Typography variant="body2" sx={{ fontWeight: 700, color: '#667eea' }}>
              2-4 hrs
            </Typography>
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
};

export default LogisticsImpactPanel;

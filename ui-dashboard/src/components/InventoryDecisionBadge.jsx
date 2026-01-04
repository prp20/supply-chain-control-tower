import React, { useMemo } from 'react';
import { Box, Chip, Tooltip, Typography } from '@mui/material';
import { TrendingDown, AlertTriangle, Eye } from '@mui/icons-material';

const InventoryDecisionBadge = ({ partId, decisions = [], onBadgeClick }) => {
  const affectingDecisions = useMemo(() => {
    return decisions.filter((d) => {
      const partPattern = partId.toUpperCase();
      const actionUpper = d.action?.toUpperCase() || '';
      const explanationUpper = d.explanation?.toUpperCase() || '';
      return actionUpper.includes(partPattern) || explanationUpper.includes(partPattern);
    });
  }, [partId, decisions]);

  if (affectingDecisions.length === 0) {
    return null;
  }

  const getOverallStatus = () => {
    const hasHighPriority = affectingDecisions.some((d) => d.priority === 'HIGH');
    const hasReplenishment = affectingDecisions.some((d) => d.type === 'replenishment');
    const hasAlert = affectingDecisions.some((d) => d.type === 'alert');

    if (hasHighPriority && hasReplenishment) return 'REPLENISH NOW';
    if (hasHighPriority) return 'CRITICAL';
    if (hasReplenishment) return 'REPLENISH';
    if (hasAlert) return 'MONITOR';
    return 'AFFECTED';
  };

  const getStatusColor = (status) => {
    const colorMap = {
      'REPLENISH NOW': { bg: '#ff6b6b', text: 'white' },
      CRITICAL: { bg: '#fa709a', text: 'white' },
      REPLENISH: { bg: '#ffa94d', text: 'white' },
      MONITOR: { bg: '#4facfe', text: 'white' },
      AFFECTED: { bg: '#667eea', text: 'white' },
    };
    return colorMap[status] || colorMap.AFFECTED;
  };

  const getStatusIcon = (status) => {
    const iconMap = {
      'REPLENISH NOW': TrendingDown,
      CRITICAL: AlertTriangle,
      REPLENISH: TrendingDown,
      MONITOR: Eye,
      AFFECTED: Eye,
    };
    return iconMap[status] || Eye;
  };

  const status = getOverallStatus();
  const statusColor = getStatusColor(status);
  const StatusIcon = getStatusIcon(status);

  const tooltipItems = affectingDecisions.map((d) => (
    <Box key={d.decision_id} sx={{ mb: 1, pb: 1, borderBottom: '1px solid rgba(255,255,255,0.2)' }}>
      <Typography variant="caption" sx={{ fontWeight: 600, display: 'block' }}>
        {d.action}
      </Typography>
      <Typography variant="caption" sx={{ opacity: 0.8, display: 'block' }}>
        Priority: {d.priority} Confidence: {(d.confidence * 100).toFixed(0)}%
      </Typography>
    </Box>
  ));

  const decisionCount = affectingDecisions.length;
  const decisionWord = decisionCount !== 1 ? 'Decisions' : 'Decision';

  const tooltipContent = (
    <Box>
      <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1, color: 'inherit' }}>
        {decisionCount} {decisionWord} Affecting This Part
      </Typography>
      {tooltipItems}
    </Box>
  );

  const chipStyle = {
    backgroundColor: statusColor.bg,
    color: statusColor.text,
    fontWeight: 700,
    fontSize: '0.75rem',
    height: 28,
    cursor: 'pointer',
  };

  const handleClick = () => {
    if (onBadgeClick && affectingDecisions[0]) {
      onBadgeClick(affectingDecisions[0]);
    }
  };

  return (
    <Tooltip title={tooltipContent} arrow placement="top">
      <Chip label={status} onClick={handleClick} icon={React.createElement(StatusIcon)} style={chipStyle} />
    </Tooltip>
  );
};

export default InventoryDecisionBadge;

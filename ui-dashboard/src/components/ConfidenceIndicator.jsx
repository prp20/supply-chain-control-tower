import React from 'react';
import {
  Box,
  CircularProgress,
  Typography,
  Tooltip,
  LinearProgress,
  Chip,
  Paper,
} from '@mui/material';
import { CheckCircle, WarningAmber, Error } from '@mui/icons-material';

/**
 * Confidence Indicator Component
 * Displays confidence levels in multiple visual formats
 *
 * @param {number} confidence - Confidence value (0-1)
 * @param {string} variant - Display variant: 'circular', 'linear', 'badge', 'ring', 'detailed'
 * @param {string} size - Size: 'small', 'medium', 'large'
 * @param {Function} onHover - Callback when hovering over indicator
 */
const ConfidenceIndicator = ({
  confidence = 0.85,
  variant = 'circular',
  size = 'medium',
  onHover,
  showLabel = true,
}) => {
  const percentage = Math.round(confidence * 100);

  // Determine confidence level and color
  const getConfidenceLevel = () => {
    if (confidence >= 0.85) return { level: 'Very High', color: '#43e97b', bg: '#e8f5e9' };
    if (confidence >= 0.70) return { level: 'High', color: '#4facfe', bg: '#e3f2fd' };
    if (confidence >= 0.55) return { level: 'Medium', color: '#ffa94d', bg: '#fff3e0' };
    return { level: 'Low', color: '#ff6b6b', bg: '#ffebee' };
  };

  const confLevel = getConfidenceLevel();

  // Size configurations
  const sizeConfig = {
    small: { size: 40, fontSize: '0.75rem', chipSize: 'small', circleSize: 36 },
    medium: { size: 60, fontSize: '0.875rem', chipSize: 'medium', circleSize: 56 },
    large: { size: 100, fontSize: '1.125rem', chipSize: 'medium', circleSize: 96 },
  };

  const config = sizeConfig[size];

  const handleMouseEnter = () => {
    if (onHover) onHover(true);
  };

  const handleMouseLeave = () => {
    if (onHover) onHover(false);
  };

  // Render circular variant
  const renderCircular = () => (
    <Tooltip
      title={`Confidence: ${percentage}% - ${confLevel.level}`}
      arrow
      placement="top"
    >
      <Box
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        sx={{ position: 'relative', display: 'inline-flex' }}
      >
        <CircularProgress
          variant="determinate"
          value={percentage}
          sx={{
            color: confLevel.color,
            '& .MuiCircularProgress-circle': {
              strokeLinecap: 'round',
            },
          }}
          size={config.size}
          thickness={size === 'large' ? 3 : 4}
        />
        <Box
          sx={{
            top: 0,
            left: 0,
            bottom: 0,
            right: 0,
            position: 'absolute',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Typography variant="body2" sx={{ fontWeight: 700, color: confLevel.color, fontSize: config.fontSize }}>
            {percentage}%
          </Typography>
        </Box>
      </Box>
    </Tooltip>
  );

  // Render linear variant
  const renderLinear = () => (
    <Tooltip
      title={`Confidence: ${percentage}% - ${confLevel.level}`}
      arrow
      placement="top"
    >
      <Box
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        sx={{ width: '100%' }}
      >
        {showLabel && (
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
            <Typography variant="caption" sx={{ fontWeight: 600, color: '#333' }}>
              Confidence Level
            </Typography>
            <Typography variant="caption" sx={{ fontWeight: 700, color: confLevel.color }}>
              {percentage}%
            </Typography>
          </Box>
        )}
        <LinearProgress
          variant="determinate"
          value={percentage}
          sx={{
            height: size === 'small' ? 6 : size === 'medium' ? 8 : 12,
            borderRadius: 4,
            backgroundColor: '#e0e0e0',
            '& .MuiLinearProgress-bar': {
              borderRadius: 4,
              background: `linear-gradient(90deg, ${confLevel.color} 0%, ${confLevel.color}dd 100%)`,
              transition: 'all 0.3s ease',
            },
          }}
        />
      </Box>
    </Tooltip>
  );

  // Render badge variant
  const renderBadge = () => {
    const icon =
      confidence >= 0.85 ? (
        <CheckCircle sx={{ fontSize: 16 }} />
      ) : confidence >= 0.55 ? (
        <WarningAmber sx={{ fontSize: 16 }} />
      ) : (
        <Error sx={{ fontSize: 16 }} />
      );

    return (
      <Tooltip
        title={`Confidence: ${percentage}% - ${confLevel.level}`}
        arrow
        placement="top"
      >
        <Chip
          icon={icon}
          label={`${percentage}% Confidence`}
          size={config.chipSize}
          sx={{
            backgroundColor: confLevel.bg,
            color: confLevel.color,
            fontWeight: 700,
            border: `2px solid ${confLevel.color}`,
            '& .MuiChip-icon': {
              color: confLevel.color,
            },
          }}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        />
      </Tooltip>
    );
  };

  // Render ring variant
  const renderRing = () => (
    <Tooltip
      title={`Confidence: ${percentage}% - ${confLevel.level}`}
      arrow
      placement="top"
    >
      <Box
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        sx={{
          position: 'relative',
          width: config.circleSize,
          height: config.circleSize,
          borderRadius: '50%',
          border: `4px solid ${confLevel.color}`,
          backgroundColor: confLevel.bg,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'all 0.3s ease',
          '&:hover': {
            boxShadow: `0 0 20px ${confLevel.color}40`,
            transform: 'scale(1.05)',
          },
        }}
      >
        <Box sx={{ textAlign: 'center' }}>
          <Typography variant="body2" sx={{ fontWeight: 700, color: confLevel.color, lineHeight: 1 }}>
            {percentage}%
          </Typography>
          <Typography
            variant="caption"
            sx={{
              fontWeight: 600,
              color: confLevel.color,
              fontSize: '0.6rem',
              textTransform: 'uppercase',
              letterSpacing: 0.5,
            }}
          >
            {confLevel.level.split(' ')[0]}
          </Typography>
        </Box>
      </Box>
    </Tooltip>
  );

  // Render detailed variant
  const renderDetailed = () => {
    const signals = [
      { label: 'Data Quality', score: Math.round(confidence * 100) },
      { label: 'Model Accuracy', score: Math.round(confidence * 95) },
      { label: 'Feature Coverage', score: Math.round(confidence * 92) },
    ];

    return (
      <Paper
        sx={{
          p: 2,
          background: confLevel.bg,
          border: `2px solid ${confLevel.color}`,
          borderRadius: 1.5,
        }}
      >
        <Box sx={{ mb: 1.5 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#333' }}>
              Overall Confidence
            </Typography>
            <Chip
              label={confLevel.level}
              size="small"
              sx={{
                backgroundColor: confLevel.color,
                color: 'white',
                fontWeight: 700,
              }}
            />
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
            <Box sx={{ flex: 1 }}>
              <LinearProgress
                variant="determinate"
                value={percentage}
                sx={{
                  height: 8,
                  borderRadius: 4,
                  backgroundColor: `${confLevel.color}30`,
                  '& .MuiLinearProgress-bar': {
                    background: `linear-gradient(90deg, ${confLevel.color} 0%, ${confLevel.color}dd 100%)`,
                    borderRadius: 4,
                  },
                }}
              />
            </Box>
            <Typography
              variant="body2"
              sx={{ fontWeight: 700, color: confLevel.color, minWidth: 40, textAlign: 'right' }}
            >
              {percentage}%
            </Typography>
          </Box>
        </Box>

        <Box sx={{ borderTop: `1px solid ${confLevel.color}40`, pt: 1.5 }}>
          <Typography variant="caption" sx={{ fontWeight: 600, color: '#666', display: 'block', mb: 1 }}>
            Contributing Factors:
          </Typography>
          {signals.map((signal, idx) => (
            <Box
              key={idx}
              sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                mb: 0.75,
              }}
            >
              <Typography variant="caption" sx={{ color: '#555' }}>
                {signal.label}
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <Box
                  sx={{
                    height: 4,
                    width: 60,
                    backgroundColor: `${confLevel.color}30`,
                    borderRadius: 2,
                    overflow: 'hidden',
                  }}
                >
                  <Box
                    sx={{
                      height: '100%',
                      width: `${signal.score}%`,
                      backgroundColor: confLevel.color,
                      transition: 'width 0.3s ease',
                    }}
                  />
                </Box>
                <Typography variant="caption" sx={{ fontWeight: 600, color: confLevel.color, minWidth: 30 }}>
                  {signal.score}%
                </Typography>
              </Box>
            </Box>
          ))}
        </Box>
      </Paper>
    );
  };

  // Render variant
  const variants = {
    circular: renderCircular(),
    linear: renderLinear(),
    badge: renderBadge(),
    ring: renderRing(),
    detailed: renderDetailed(),
  };

  return variants[variant] || variants.circular;
};

export default ConfidenceIndicator;

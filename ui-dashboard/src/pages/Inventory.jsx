import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Paper,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  CircularProgress,
  Alert,
  TextField,
  Button,
  Card,
  CardContent,
  LinearProgress,
  Drawer,
  Divider,
} from '@mui/material';
import {
  WarningAmber,
  CheckCircle,
  Search as SearchIcon,
  Add as AddIcon,
  Close as CloseIcon,
  LocalShipping,
  CheckCircleOutline,
  ErrorOutline,
} from '@mui/icons-material';
import { inventoryAPI } from '../services/api';
import { useRedisStream } from '../hooks/useRedisStream';

// 🧩 Utility: Calculate health score (0-100)
const calculateHealthScore = (current, minimum) => {
  if (current >= minimum * 2) return 100;
  if (current >= minimum) return 75;
  if (current > 0) return 40;
  return 0;
};

// 🧩 Utility: Get risk level based on health score
const getRiskLevel = (healthScore) => {
  if (healthScore >= 75) return { level: 'SAFE', color: '#10b981', icon: '✓' };
  if (healthScore >= 50) return { level: 'MONITOR', color: '#FFB600', icon: '⚠' };
  if (healthScore > 0) return { level: 'AT RISK', color: '#E0301E', icon: '!' };
  return { level: 'CRITICAL', color: '#DB536A', icon: '!!!' };
};

// 🧩 Utility: Get background color for heatmap cell
const getHealthColor = (healthScore) => {
  if (healthScore >= 75) return '#D1E7DD';  // Light green
  if (healthScore >= 50) return '#FFF3CD';  // Light yellow
  if (healthScore > 0) return '#F8D7DA';    // Light pink
  return '#EBD8DC';                         // Darker pink for critical
};

// ===================================================================
// 1️⃣ INVENTORY OVERVIEW SECTION (KPI Cards)
// ===================================================================
const InventoryOverview = ({ items, alerts, replenishments }) => {
  const totalParts = items.length;
  const belowMinimum = items.filter((i) => i.current_stock < i.minimum_required).length;
  const criticalRisk = items.filter((i) => calculateHealthScore(i.current_stock, i.minimum_required) === 0).length;
  const activeReplenishments = replenishments.filter((r) => r.status !== 'Completed').length;

  return (
    <Grid container spacing={2} sx={{ mb: 3, justifyContent: 'center' }}>
      <Grid item xs={12} sm={6} md={5} lg={2.4}>
        <Card sx={{ background: 'linear-gradient(135deg, #EB8C00 0%, #F5A623 100%)', color: 'white' }}>
          <CardContent sx={{ py: 2 }}>
            <Typography variant="h5" sx={{ fontWeight: 700 }}>
              {totalParts}
            </Typography>
            <Typography variant="body2" sx={{ opacity: 0.9 }}>
              Total Parts Tracked
            </Typography>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} sm={6} md={5} lg={2.4}>
        <Card sx={{ background: 'linear-gradient(135deg, #FFB600 0%, #FFC933 100%)', color: '#000000' }}>
          <CardContent sx={{ py: 2 }}>
            <Typography variant="h5" sx={{ fontWeight: 700 }}>
              {belowMinimum}
            </Typography>
            <Typography variant="body2" sx={{ opacity: 0.8 }}>
              Below Minimum
            </Typography>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} sm={6} md={5} lg={2.4}>
        <Card sx={{ background: 'linear-gradient(135deg, #E0301E 0%, #F24736 100%)', color: 'white' }}>
          <CardContent sx={{ py: 2 }}>
            <Typography variant="h5" sx={{ fontWeight: 700 }}>
              {criticalRisk}
            </Typography>
            <Typography variant="body2" sx={{ opacity: 0.9 }}>
              Critical Parts At Risk
            </Typography>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} sm={6} md={5} lg={2.4}>
        <Card sx={{ background: 'linear-gradient(135deg, #DB536A 0%, #E87A94 100%)', color: 'white' }}>
          <CardContent sx={{ py: 2 }}>
            <Typography variant="h5" sx={{ fontWeight: 700 }}>
              {activeReplenishments}
            </Typography>
            <Typography variant="body2" sx={{ opacity: 0.9 }}>
              Auto-Replenishments
            </Typography>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );
};

// ===================================================================
// 2️⃣ INVENTORY RISK HEATMAP (Core Visual)
// ===================================================================
const RiskHeatmap = ({ items, onSelectPart, selectedPartId }) => (
  <Paper sx={{ p: 3, background: '#FFFFFF', border: '1px solid #DEDEDE', mb: 3 }}>
    <Typography variant="h6" sx={{ fontWeight: 700, color: '#EB8C00', mb: 2 }}>
      🔥 Inventory Risk Heatmap
    </Typography>
    <TableContainer>
      <Table size="small">
        <TableHead>
          <TableRow sx={{ backgroundColor: '#F9F9F9' }}>
            <TableCell sx={{ fontWeight: 700, color: '#EB8C00' }}>Part Name</TableCell>
            <TableCell align="center" sx={{ fontWeight: 700, color: '#EB8C00' }}>
              Criticality
            </TableCell>
            <TableCell align="center" sx={{ fontWeight: 700, color: '#EB8C00' }}>
              Health Score
            </TableCell>
            <TableCell align="center" sx={{ fontWeight: 700, color: '#EB8C00' }}>
              Risk Level
            </TableCell>
            <TableCell align="center" sx={{ fontWeight: 700, color: '#EB8C00' }}>
              Stock Status
            </TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {items.map((item) => {
            const healthScore = calculateHealthScore(item.current_stock, item.minimum_required);
            const riskData = getRiskLevel(healthScore);
            const cellBg = getHealthColor(healthScore);
            const isSelected = selectedPartId === item.part_id;

            return (
              <TableRow
                key={item.part_id}
                onClick={() => onSelectPart(item)}
                sx={{
                  backgroundColor: isSelected ? '#F0F0F0' : 'inherit',
                  cursor: 'pointer',
                  '&:hover': {
                    backgroundColor: '#F5F5F5',
                    transform: 'scale(1.01)',
                  },
                  transition: 'all 0.2s ease',
                  borderLeft: isSelected ? '4px solid #EB8C00' : 'none',
                }}
              >
                <TableCell sx={{ fontWeight: 600 }}>{item.part || 'Unknown'}</TableCell>
                <TableCell align="center">
                  <Chip
                    label={item.criticality || 'NORMAL'}
                    size="small"
                    color={item.criticality === 'HIGH' ? 'error' : 'default'}
                    sx={{ fontWeight: 600 }}
                  />
                </TableCell>
                <TableCell align="center">
                  <Box
                    sx={{
                      display: 'inline-block',
                      backgroundColor: cellBg,
                      padding: '4px 12px',
                      borderRadius: '20px',
                      fontWeight: 700,
                      color: '#000',
                    }}
                  >
                    {healthScore}
                  </Box>
                </TableCell>
                <TableCell align="center">
                  <Chip
                    label={riskData.level}
                    size="small"
                    sx={{
                      backgroundColor: riskData.color,
                      color: 'white',
                      fontWeight: 700,
                    }}
                  />
                </TableCell>
                <TableCell align="center">
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    {item.current_stock} / {item.minimum_required}
                  </Typography>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </TableContainer>
  </Paper>
);

// ===================================================================
// 3️⃣ DRILL-DOWN PANEL (Right-side Drawer)
// ===================================================================
const PartDetailDrawer = ({ open, part, onClose, replenishments }) => {
  if (!part) return null;

  const healthScore = calculateHealthScore(part.current_stock, part.minimum_required);
  const riskData = getRiskLevel(healthScore);
  const stockGap = Math.max(0, part.minimum_required - part.current_stock);
  const partReplenishments = replenishments.filter((r) => r.part_id === part.part_id);

  let recommendation = 'OK';
  if (stockGap > 0 && stockGap <= part.minimum_required * 0.5) recommendation = 'Monitor';
  if (stockGap > part.minimum_required * 0.5) recommendation = 'Replenish in progress';
  if (part.current_stock === 0) recommendation = 'URGENT - Out of Stock';

  return (
    <Drawer anchor="right" open={open} onClose={onClose} sx={{ zIndex: 1300 }}>
      <Box sx={{ width: { xs: '100vw', sm: 400 }, p: 3, backgroundColor: '#FFFFFF', minHeight: '100vh' }}>
        {/* Header */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h6" sx={{ fontWeight: 700, color: '#EB8C00' }}>
            Part Details
          </Typography>
          <Button size="small" onClick={onClose} sx={{ minWidth: 0 }}>
            <CloseIcon />
          </Button>
        </Box>

        <Divider sx={{ backgroundColor: '#DEDEDE', mb: 3 }} />

        {/* Part Info */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="body2" color="textSecondary" sx={{ mb: 0.5 }}>
            Part Name
          </Typography>
          <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>
            {part.part}
          </Typography>

          <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
            <Chip label={riskData.level} sx={{ backgroundColor: riskData.color, color: 'white', fontWeight: 700 }} />
            <Chip label={`Health: ${healthScore}`} variant="outlined" />
          </Box>
        </Box>

        {/* Stock Gap Visualization */}
        <Paper sx={{ p: 2, background: '#F9F9F9', border: '1px solid #DEDEDE', mb: 3 }}>
          <Typography variant="body2" color="textSecondary" sx={{ mb: 1 }}>
            Stock Gap Analysis
          </Typography>
          <Box sx={{ mb: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                Current: {part.current_stock}
              </Typography>
              <Typography variant="body2" sx={{ fontWeight: 600, color: '#ef4444' }}>
                Gap: {stockGap}
              </Typography>
            </Box>
            <LinearProgress
              variant="determinate"
              value={Math.min((part.current_stock / part.minimum_required) * 100, 100)}
              sx={{
                height: 8,
                borderRadius: 4,
                backgroundColor: '#F0F0F0',
                '& .MuiLinearProgress-bar': {
                  background: riskData.color,
                },
              }}
            />
            <Typography variant="caption" color="textSecondary" sx={{ mt: 1, display: 'block' }}>
              Target: {part.minimum_required} units
            </Typography>
          </Box>
        </Paper>

        {/* System Recommendation */}
        <Paper sx={{ p: 2, background: '#F9F9F9', border: '1px solid #DEDEDE', mb: 3 }}>
          <Typography variant="body2" color="textSecondary" sx={{ mb: 1 }}>
            System Recommendation
          </Typography>
          <Chip
            label={recommendation}
            color={
              recommendation === 'OK'
                ? 'success'
                : recommendation === 'Monitor'
                  ? 'warning'
                  : recommendation === 'URGENT - Out of Stock'
                    ? 'error'
                    : 'info'
            }
            sx={{ fontWeight: 700 }}
          />
        </Paper>

        {/* Supplier Risk */}
        <Paper sx={{ p: 2, background: '#F9F9F9', border: '1px solid #DEDEDE', mb: 3 }}>
          <Typography variant="body2" color="textSecondary" sx={{ mb: 1 }}>
            Supplier Status
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <CheckCircleOutline sx={{ color: '#10b981' }} />
            <Typography variant="body2">Ready to supply</Typography>
          </Box>
        </Paper>

        {/* Active Replenishments */}
        <Box sx={{ mb: 2 }}>
          <Typography variant="body2" sx={{ fontWeight: 700, mb: 2 }}>
            Active Replenishments ({partReplenishments.length})
          </Typography>
          {partReplenishments.length > 0 ? (
            partReplenishments.map((rep, idx) => (
              <Paper
                key={idx}
                sx={{ p: 2, background: '#F9F9F9', border: '1px solid #DEDEDE', mb: 2 }}
              >
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    Qty: {rep.quantity} units
                  </Typography>
                  <Chip
                    label={rep.status}
                    size="small"
                    color={rep.status === 'Completed' ? 'success' : 'info'}
                  />
                </Box>
                <Typography variant="caption" color="textSecondary">
                  {rep.timestamp}
                </Typography>
              </Paper>
            ))
          ) : (
            <Typography variant="body2" color="textSecondary">
              No active replenishments
            </Typography>
          )}
        </Box>
      </Box>
    </Drawer>
  );
};

// ===================================================================
// 4️⃣ LIVE INVENTORY ALERT FEED
// ===================================================================
const AlertFeed = ({ alerts }) => (
  <Paper sx={{ p: 3, background: '#F9F9F9', border: '1px solid #DEDEDE', mb: 3 }}>
    <Typography variant="h6" sx={{ fontWeight: 700, color: '#EB8C00', mb: 2 }}>
      📢 Live Inventory Alerts
    </Typography>
    {alerts.length > 0 ? (
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
        {alerts.map((alert, idx) => (
          <Box
            key={idx}
            sx={{
              p: 2,
              backgroundColor: '#F0F0F0',
              borderLeft: `4px solid ${alert.severity === 'critical' ? '#ef4444' : '#f59e0b'}`,
              borderRadius: '4px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <Box>
              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                {alert.message}
              </Typography>
              <Typography variant="caption" color="textSecondary">
                {alert.time}
              </Typography>
            </Box>
            <Chip
              label={alert.severity.toUpperCase()}
              size="small"
              color={alert.severity === 'critical' ? 'error' : 'warning'}
            />
          </Box>
        ))}
      </Box>
    ) : (
      <Typography variant="body2" color="textSecondary">
        ✓ No active alerts
      </Typography>
    )}
  </Paper>
);

// ===================================================================
// 5️⃣ AUTO-REPLENISHMENT TRACKER
// ===================================================================
const ReplenishmentTracker = ({ replenishments }) => {
  const activeReplenishments = replenishments.filter((r) => r.status !== 'Completed');
  const completedReplenishments = replenishments.filter((r) => r.status === 'Completed');

  return (
    <Paper sx={{ p: 3, background: '#F9F9F9', border: '1px solid #DEDEDE' }}>
      <Typography variant="h6" sx={{ fontWeight: 700, color: '#EB8C00', mb: 2 }}>
        🚚 Auto-Replenishment Tracker
      </Typography>

      {/* Active Replenishments */}
      {activeReplenishments.length > 0 && (
        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 2 }}>
            In Progress ({activeReplenishments.length})
          </Typography>
          {activeReplenishments.map((rep, idx) => (
            <Box
              key={idx}
              sx={{
                p: 2,
                backgroundColor: '#F0F0F0',
                borderRadius: '8px',
                mb: 1.5,
                borderLeft: '4px solid #EB8C00',
              }}
            >
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  {rep.part}
                </Typography>
                <Chip
                  label={rep.status}
                  size="small"
                  icon={
                    rep.status === 'Requested' ? <ErrorOutline sx={{ fontSize: 16 }} /> : <LocalShipping sx={{ fontSize: 16 }} />
                  }
                  color="info"
                />
              </Box>
              <Typography variant="body2" sx={{ mb: 1 }}>
                Qty: {rep.quantity} | Trip: {rep.trip_id || 'Planning...'}
              </Typography>
              <LinearProgress
                variant="determinate"
                value={
                  rep.status === 'Requested'
                    ? 25
                    : rep.status === 'Route planned'
                      ? 50
                      : rep.status === 'In transit'
                        ? 75
                        : 100
                }
                sx={{
                  height: 4,
                  borderRadius: 2,
                  backgroundColor: '#F9F9F9',
                  '& .MuiLinearProgress-bar': {
                    background: 'linear-gradient(90deg, #EB8C00 0%, #FFB600 100%)',
                  },
                }}
              />
            </Box>
          ))}
        </Box>
      )}

      {/* Recently Completed */}
      {completedReplenishments.length > 0 && (
        <Box>
          <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 2 }}>
            Recently Completed ({completedReplenishments.length})
          </Typography>
          {completedReplenishments.slice(0, 3).map((rep, idx) => (
            <Box
              key={idx}
              sx={{
                p: 2,
                backgroundColor: '#F0F0F0',
                borderRadius: '8px',
                mb: 1.5,
                borderLeft: '4px solid #10b981',
                opacity: 0.7,
              }}
            >
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  {rep.part}
                </Typography>
                <Chip label="Completed" size="small" icon={<CheckCircle sx={{ fontSize: 16 }} />} color="success" />
              </Box>
              <Typography variant="body2">Qty: {rep.quantity}</Typography>
            </Box>
          ))}
        </Box>
      )}

      {activeReplenishments.length === 0 && completedReplenishments.length === 0 && (
        <Typography variant="body2" color="textSecondary">
          No replenishment activities yet
        </Typography>
      )}
    </Paper>
  );
};

// ===================================================================
// MAIN INVENTORY COMPONENT
// ===================================================================
const Inventory = () => {
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedPart, setSelectedPart] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredInventory, setFilteredInventory] = useState([]);

  // Mock data - replace with real data from backend
  const [alerts] = useState([
    { message: 'ITEM-001 stock below minimum', severity: 'warning', time: '2 min ago' },
    { message: 'ITEM-003 at critical level', severity: 'critical', time: '5 min ago' },
  ]);

  const [replenishments] = useState([
    {
      part_id: 'PART-001',
      part: 'Spark Plug',
      quantity: 50,
      status: 'In transit',
      trip_id: 'TRIP-001',
      timestamp: '2025-01-04 14:30',
    },
    {
      part_id: 'PART-003',
      part: 'Oil Filter',
      quantity: 30,
      status: 'Route planned',
      trip_id: 'TRIP-002',
      timestamp: '2025-01-04 13:45',
    },
    {
      part_id: 'PART-005',
      part: 'Battery',
      quantity: 20,
      status: 'Completed',
      trip_id: 'TRIP-123',
      timestamp: '2025-01-03 18:00',
    },
  ]);

  // Handle Redis stream events
  const handleStreamEvent = (data) => {
    console.log('Inventory update:', data);
    // Update inventory based on stream events
  };

  const { subscribe } = useRedisStream(handleStreamEvent);

  useEffect(() => {
    fetchInventory();
    // Subscribe to inventory streams
    subscribe('inventory.health.updated');
    subscribe('inventory.low_stock');
  }, []);

  useEffect(() => {
    if (searchQuery.trim()) {
      setFilteredInventory(
        inventory.filter(
          (item) =>
            item.part?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            item.part_id?.toLowerCase().includes(searchQuery.toLowerCase())
        )
      );
    } else {
      setFilteredInventory(inventory);
    }
  }, [searchQuery, inventory]);

  const fetchInventory = async () => {
    try {
      setLoading(true);
      const response = await inventoryAPI.getAllInventory().catch(() => ({ data: [] }));
      const inventoryData = Array.isArray(response.data) ? response.data : response.data?.data || [];

      // Transform data
      const transformed = inventoryData.map((item, idx) => ({
        part_id: item.part_id || `PART-${String(idx + 1).padStart(3, '0')}`,
        part: item.part || item.name || 'Unknown',
        current_stock: item.current_stock || 0,
        minimum_required: item.minimum_required || 10,
        criticality: item.criticality || 'NORMAL',
      }));

      setInventory(transformed);
      setFilteredInventory(transformed);
      setError(null);
    } catch (err) {
      console.error('Error fetching inventory:', err);
      setError('Failed to load inventory');
    } finally {
      setLoading(false);
    }
  };

  const handlePartClick = (part) => {
    setSelectedPart(part);
    setDrawerOpen(true);
  };

  return (
    <Box sx={{ p: 0, height: '100%', display: 'flex', flexDirection: 'column', bgcolor: 'background.default' }}>
      {/* Header */}
      <Box sx={{ p: 4, pb: 3, borderBottom: '1px solid', borderColor: '#DEDEDE', backgroundColor: '#FFFFFF' }}>
        <Typography variant="h4" sx={{ fontWeight: 700, mb: 0.5, color: '#000000' }}>
          Inventory Management
        </Typography>
        <Typography color="textSecondary" variant="body2">
          Material Risk Control & Smart Replenishment
        </Typography>
      </Box>

      {/* Content */}
      <Box sx={{ flex: 1, overflow: 'auto', p: 4, display: 'flex', flexDirection: 'column', gap: 3 }}>
        {error && <Alert severity="error">{error}</Alert>}

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', flex: 1 }}>
            <CircularProgress />
          </Box>
        ) : (
          <>
            {/* 1️⃣ INVENTORY OVERVIEW */}
            <InventoryOverview items={filteredInventory} alerts={alerts} replenishments={replenishments} />

            {/* Search */}
            <Paper
              sx={{
                p: 2,
                background: '#F9F9F9',
                border: '1px solid #DEDEDE',
              }}
            >
              <TextField
                fullWidth
                placeholder="Search parts..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                InputProps={{
                  startAdornment: <SearchIcon sx={{ mr: 1, color: 'textSecondary' }} />,
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    backgroundColor: '#F0F0F0',
                    color: '#000000',
                  },
                }}
              />
            </Paper>

            {/* 2️⃣ RISK HEATMAP */}
            <RiskHeatmap items={filteredInventory} onSelectPart={handlePartClick} selectedPartId={selectedPart?.part_id} />

            {/* 4️⃣ ALERT FEED */}
            <AlertFeed alerts={alerts} />

            {/* 5️⃣ REPLENISHMENT TRACKER */}
            <ReplenishmentTracker replenishments={replenishments} />
          </>
        )}
      </Box>

      {/* 3️⃣ DRILL-DOWN PANEL */}
      <PartDetailDrawer open={drawerOpen} part={selectedPart} onClose={() => setDrawerOpen(false)} replenishments={replenishments} />
    </Box>
  );
};

export default Inventory;

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
} from '@mui/material';
import { WarningAmber, CheckCircle, Search as SearchIcon, Add as AddIcon } from '@mui/icons-material';
import { inventoryAPI } from '../services/api';

const InventoryItemCard = ({ item }) => (
  <Card
    sx={{
      mb: 2,
      background: '#1a1f2e',
      border: '1px solid #2a3142',
      transition: 'all 0.3s ease',
      '&:hover': {
        boxShadow: '0 8px 16px rgba(102, 126, 234, 0.2)',
        transform: 'translateY(-2px)',
        borderColor: '#667eea',
      },
    }}
  >
    <CardContent>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', mb: 2 }}>
        <Box>
          <Typography variant="body2" color="textSecondary" sx={{ mb: 0.5 }}>
            {item.item_id}
          </Typography>
          <Typography variant="h6" sx={{ fontWeight: 700, color: '#667eea' }}>
            {item.name || 'Inventory Item'}
          </Typography>
        </Box>
        <Chip
          label={item.quantity > 10 ? 'In Stock' : 'Low Stock'}
          icon={item.quantity > 10 ? <CheckCircle /> : <WarningAmber />}
          color={item.quantity > 10 ? 'success' : 'warning'}
          size="small"
          sx={{ fontWeight: 600 }}
        />
      </Box>
      <Box sx={{ mb: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
          <Typography variant="body2" color="textSecondary">
            Stock Level
          </Typography>
          <Typography variant="body2" sx={{ fontWeight: 700, color: '#667eea' }}>
            {item.quantity} {item.unit || 'units'}
          </Typography>
        </Box>
        <LinearProgress
          variant="determinate"
          value={Math.min((item.quantity / 100) * 100, 100)}
          sx={{
            height: 8,
            borderRadius: 4,
            backgroundColor: '#252d3d',
            '& .MuiLinearProgress-bar': {
              background: 'linear-gradient(90deg, #667eea 0%, #764ba2 100%)',
            },
          }}
        />
      </Box>
      <Typography variant="body2" color="textSecondary">
        📍 {item.location}
      </Typography>
    </CardContent>
  </Card>
);

const Inventory = () => {
  const [inventory, setInventory] = useState([]);
  const [filteredInventory, setFilteredInventory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [view, setView] = useState('grid');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchInventory();
  }, []);

  useEffect(() => {
    if (searchQuery.trim()) {
      setFilteredInventory(
        inventory.filter(
          (item) =>
            item.item_id?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            item.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            item.location?.toLowerCase().includes(searchQuery.toLowerCase())
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
      
      // Transform backend data to match UI expectations
      const transformedInventory = inventoryData.map((item, idx) => ({
        id: idx + 1,
        item_id: `ITEM-${String(idx + 1).padStart(3, '0')}`,
        name: item.part || item.name || 'Unknown Item',
        quantity: item.current_stock || 0,
        unit: 'units',
        location: 'Warehouse',
        minimum_required: item.minimum_required || 10,
        criticality: item.criticality || 'NORMAL',
      }));
      
      setInventory(transformedInventory);
      setFilteredInventory(transformedInventory);
      setError(null);
    } catch (err) {
      console.error('Error fetching inventory:', err);
      setError('Failed to load inventory');
      setInventory([]);
      setFilteredInventory([]);
    } finally {
      setLoading(false);
    }
  };

  const totalQuantity = filteredInventory.reduce((sum, item) => sum + (item.quantity || 0), 0);
  const lowStockItems = filteredInventory.filter((item) => item.quantity < 10);

  return (
    <Box sx={{ p: 0, height: '100%', display: 'flex', flexDirection: 'column', bgcolor: 'background.default' }}>
      {/* Header Section */}
      <Box sx={{ p: 4, pb: 3, borderBottom: '1px solid', borderColor: '#2a3142', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 700, mb: 0.5 }}>
            Inventory Management
          </Typography>
          <Typography color="textSecondary" variant="body2">
            Track and manage your supply chain inventory
          </Typography>
        </Box>
        <Button variant="contained" startIcon={<AddIcon />} sx={{ display: { xs: 'none', sm: 'flex' } }}>
          Add Item
        </Button>
      </Box>

      {/* Scrollable Content */}
      <Box sx={{ flex: 1, overflow: 'auto', p: 4, display: 'flex', flexDirection: 'column', gap: 4 }}>
        {error && <Alert severity="error">{error}</Alert>}

        {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', flex: 1 }}>
          <CircularProgress />
        </Box>
      ) : (
        <>
          {/* Stats - centered and responsive */}
          <Grid container spacing={2} sx={{ justifyContent: 'center' }}>
            <Grid item xs={12} sm={6} md={5} lg={2.4}>
              <Card
                sx={{
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  color: 'white',
                }}
              >
                <CardContent sx={{ py: 2 }}>
                  <Typography variant="h5" sx={{ fontWeight: 700 }}>
                    {filteredInventory.length}
                  </Typography>
                  <Typography variant="body2" sx={{ opacity: 0.9 }}>
                    Total Items
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={5} lg={2.4}>
              <Card
                sx={{
                  background: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
                  color: 'white',
                }}
              >
                <CardContent sx={{ py: 2 }}>
                  <Typography variant="h5" sx={{ fontWeight: 700 }}>
                    {totalQuantity}
                  </Typography>
                  <Typography variant="body2" sx={{ opacity: 0.9 }}>
                    Total Quantity
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={5} lg={2.4}>
              <Card
                sx={{
                  background: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
                  color: 'white',
                }}
              >
                <CardContent sx={{ py: 2 }}>
                  <Typography variant="h5" sx={{ fontWeight: 700 }}>
                    {lowStockItems.length}
                  </Typography>
                  <Typography variant="body2" sx={{ opacity: 0.9 }}>
                    Low Stock
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={5} lg={2.4}>
              <Card
                sx={{
                  background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
                  color: 'white',
                }}
              >
                <CardContent sx={{ py: 2 }}>
                  <Typography variant="h5" sx={{ fontWeight: 700 }}>
                    {lowStockItems.length === 0 ? '✓' : '⚠'}
                  </Typography>
                  <Typography variant="body2" sx={{ opacity: 0.9 }}>
                    Health Status
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {/* Search and View Toggle */}
          <Paper
            sx={{
              p: 2,
              mb: 3,
              background: '#1a1f2e',
              border: '1px solid #2a3142',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: 2,
              flexWrap: { xs: 'wrap', sm: 'nowrap' },
            }}
          >
            <TextField
              placeholder="Search inventory..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              size="small"
              InputProps={{
                startAdornment: <SearchIcon sx={{ mr: 1, color: 'textSecondary' }} />,
              }}
              sx={{
                flex: 1,
                '& .MuiOutlinedInput-root': {
                  backgroundColor: '#252d3d',
                  color: '#e3e6f0',
                },
              }}
            />
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button
                variant={view === 'grid' ? 'contained' : 'outlined'}
                onClick={() => setView('grid')}
                size="small"
              >
                Grid
              </Button>
              <Button
                variant={view === 'table' ? 'contained' : 'outlined'}
                onClick={() => setView('table')}
                size="small"
              >
                Table
              </Button>
            </Box>
          </Paper>

          {/* Grid View */}
          {view === 'grid' && (
            <Grid container spacing={2}>
              {filteredInventory.length > 0 ? (
                filteredInventory.map((item) => (
                  <Grid item xs={12} sm={6} md={4} key={item.id}>
                    <InventoryItemCard item={item} />
                  </Grid>
                ))
              ) : (
                <Grid item xs={12}>
                  <Alert severity="info">No inventory items found</Alert>
                </Grid>
              )}
            </Grid>
          )}

          {/* Table View */}
          {view === 'table' && (
            <TableContainer
              component={Paper}
              sx={{
                background: '#1a1f2e',
                border: '1px solid #2a3142',
              }}
            >
              <Table>
                <TableHead>
                  <TableRow sx={{ backgroundColor: '#0f1419' }}>
                    <TableCell sx={{ fontWeight: 700, color: '#667eea' }}>Item ID</TableCell>
                    <TableCell sx={{ fontWeight: 700, color: '#667eea' }}>Name</TableCell>
                    <TableCell sx={{ fontWeight: 700, color: '#667eea' }}>Quantity</TableCell>
                    <TableCell sx={{ fontWeight: 700, color: '#667eea' }}>Location</TableCell>
                    <TableCell sx={{ fontWeight: 700, color: '#667eea' }}>Status</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredInventory.length > 0 ? (
                    filteredInventory.map((item) => (
                      <TableRow
                        key={item.id}
                        sx={{
                          '&:hover': { backgroundColor: '#252d3d' },
                          transition: 'all 0.2s ease',
                        }}
                      >
                        <TableCell sx={{ fontWeight: 600, color: '#667eea' }}>
                          {item.item_id}
                        </TableCell>
                        <TableCell>{item.name}</TableCell>
                        <TableCell>
                          {item.quantity} {item.unit}
                        </TableCell>
                        <TableCell>{item.location}</TableCell>
                        <TableCell>
                          <Chip
                            label={item.quantity > 10 ? 'In Stock' : 'Low Stock'}
                            color={item.quantity > 10 ? 'success' : 'warning'}
                            size="small"
                            sx={{ fontWeight: 600 }}
                          />
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={5} align="center" sx={{ py: 4 }}>
                        No inventory items found
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </>
      )}
      </Box>
    </Box>
  );
};

export default Inventory;

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
} from '@mui/material';
import { Search as SearchIcon, Map as MapIcon } from '@mui/icons-material';
import { tripsAPI } from '../services/api';

const Trips = () => {
  const navigate = useNavigate();
  const [trips, setTrips] = useState([]);
  const [filteredTrips, setFilteredTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Helper function to get status color
  const getStatusColor = (status) => {
    if (!status) return 'default';
    const statusStr = status.toLowerCase();
    if (statusStr.includes('completed')) return 'success';
    if (statusStr.includes('in transit') || statusStr.includes('in progress')) return 'primary';
    if (statusStr.includes('pending') || statusStr.includes('yet to start')) return 'warning';
    return 'default';
  };

  useEffect(() => {
    fetchTrips();
  }, []);

  useEffect(() => {
    if (searchQuery.trim()) {
      setFilteredTrips(
        trips.filter(
          (trip) =>
            trip.trip_id?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            trip.origin?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            trip.destination?.toLowerCase().includes(searchQuery.toLowerCase())
        )
      );
    } else {
      setFilteredTrips(trips);
    }
  }, [searchQuery, trips]);

  const fetchTrips = async () => {
    try {
      setLoading(true);
      const response = await tripsAPI.getAllTrips().catch(() => ({ data: [] }));
      const tripsData = Array.isArray(response.data) ? response.data : response.data?.data || [];
      
      // Transform backend data to match UI expectations
      const transformedTrips = tripsData.map((trip, idx) => ({
        id: trip.trip_id || idx + 1,
        trip_id: `TRIP-${String(trip.trip_id || idx + 1).padStart(3, '0')}`,
        origin: trip.source || 'N/A',
        destination: trip.destination || 'N/A',
        part_name: trip.part_name || 'Unknown',
        status: trip.status ? trip.status.replace(/_/g, ' ') : 'PENDING',
        quantity: trip.quantity,
        cost: trip.cost,
        progress: trip.status === 'COMPLETED' ? 100 : trip.status === 'YET_TO_START' ? 0 : 65,
      }));
      
      setTrips(transformedTrips);
      setFilteredTrips(transformedTrips);
      setError(null);
    } catch (err) {
      console.error('Error fetching trips:', err);
      setError('Failed to load trips');
      setTrips([]);
      setFilteredTrips([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectTrip = (trip) => {
    // Navigate to the trip detail page
    navigate(`/trip/${trip.id}`);
  };

  const stats = {
    total: trips.length,
    inTransit: trips.filter((t) => t.status === 'In Transit').length,
    completed: trips.filter((t) => t.status === 'Completed').length,
    pending: trips.filter((t) => t.status === 'Pending').length,
  };

  return (
    <Box sx={{ p: 0, height: '100%', display: 'flex', flexDirection: 'column', bgcolor: 'background.default' }}>
      {/* Header Section */}
      <Box sx={{ p: 4, pb: 3, borderBottom: '1px solid', borderColor: '#DEDEDE', backgroundColor: '#FFFFFF' }}>
        <Typography variant="h4" sx={{ fontWeight: 700, mb: 0.5, color: '#000000' }}>
          Trips Management
        </Typography>
        <Typography color="textSecondary" variant="body2">
          Monitor and manage all active shipment routes and trips
        </Typography>
      </Box>

      {/* Scrollable Content */}
      <Box sx={{ flex: 1, overflow: 'auto', p: 4, display: 'flex', flexDirection: 'column', gap: 4 }}>

        {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', flex: 1 }}>
          <CircularProgress />
        </Box>
      ) : (
        <>
          {/* Stats Cards - centered and responsive */}
          <Grid container spacing={2} sx={{ mb: 3, justifyContent: 'center' }}>
            <Grid item xs={12} sm={6} md={5} lg={2.4}>
              <Card
                sx={{
                  background: 'linear-gradient(135deg, #EB8C00 0%, #FFB600 100%)',
                  color: 'white',
                }}
              >
                <CardContent sx={{ py: 2 }}>
                  <Typography variant="h5" sx={{ fontWeight: 700 }}>
                    {stats.total}
                  </Typography>
                  <Typography variant="body2" sx={{ opacity: 0.9 }}>
                    Total Trips
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
                    {stats.inTransit}
                  </Typography>
                  <Typography variant="body2" sx={{ opacity: 0.9 }}>
                    In Transit
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
                    {stats.completed}
                  </Typography>
                  <Typography variant="body2" sx={{ opacity: 0.9 }}>
                    Completed
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
                    {stats.pending}
                  </Typography>
                  <Typography variant="body2" sx={{ opacity: 0.9 }}>
                    Pending
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {/* Search and Filters */}
          <Paper
            sx={{
              p: 2,
              mb: 3,
              background: '#F9F9F9',
              border: '1px solid #DEDEDE',
            }}
          >
            <TextField
              fullWidth
              placeholder="Search trips by ID, origin, or destination..."
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

          {/* Trips Table */}
          <TableContainer
            component={Paper}
            sx={{
              background: '#F9F9F9',
              border: '1px solid #DEDEDE',
            }}
          >
            <Table>
              <TableHead>
                <TableRow sx={{ backgroundColor: '#FFFFFF' }}>
                  <TableCell sx={{ fontWeight: 700, color: '#EB8C00' }}>Trip ID</TableCell>
                  <TableCell sx={{ fontWeight: 700, color: '#EB8C00' }}>Route</TableCell>
                  <TableCell sx={{ fontWeight: 700, color: '#EB8C00' }}>Qty</TableCell>
                  <TableCell sx={{ fontWeight: 700, color: '#EB8C00' }}>Cost</TableCell>
                  <TableCell sx={{ fontWeight: 700, color: '#EB8C00' }}>Status</TableCell>
                  <TableCell sx={{ fontWeight: 700, color: '#EB8C00' }} align="right">
                    Action
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredTrips.length > 0 ? (
                  filteredTrips.map((trip) => (
                    <TableRow
                      key={trip.id}
                      sx={{
                        '&:hover': { backgroundColor: '#F0F0F0' },
                        transition: 'all 0.2s ease',
                      }}
                    >
                      <TableCell sx={{ fontWeight: 600, color: '#EB8C00' }}>
                        {trip.trip_id}
                      </TableCell>
                      <TableCell>{trip.origin} → {trip.destination}</TableCell>
                      <TableCell>{trip.quantity || '-'}</TableCell>
                      <TableCell>${trip.cost ? trip.cost.toLocaleString() : '-'}</TableCell>
                      <TableCell>
                        <Chip
                          label={trip.status}
                          color={getStatusColor(trip.status)}
                          size="small"
                          variant="filled"
                          sx={{ fontWeight: 600 }}
                        />
                      </TableCell>
                      <TableCell align="right">
                        <Button
                          size="small"
                          variant="outlined"
                          startIcon={<MapIcon />}
                          onClick={() => handleSelectTrip(trip)}
                          sx={{
                            color: '#EB8C00',
                            borderColor: '#EB8C00',
                            '&:hover': {
                              backgroundColor: 'rgba(102, 126, 234, 0.1)',
                            },
                          }}
                        >
                          Route
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                      <Typography color="textSecondary">No trips found</Typography>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </>
      )}
      </Box>
    </Box>
  );
};

export default Trips;

import React, { useState, useEffect } from 'react';
import {
  Grid,
  Paper,
  Card,
  CardContent,
  Typography,
  Box,
  CircularProgress,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
} from '@mui/material';
import {
  LocalShipping,
  Inventory,
  DirectionsRun,
  TrendingUp,
} from '@mui/icons-material';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { vehiclesAPI, inventoryAPI, tripsAPI } from '../services/api';

const COLORS = ['#EB8C00', '#FFB600', '#E0301E', '#DB536A'];

const StatCard = ({ title, value, icon: Icon, color, trend, trendValue }) => (
  <Card
    sx={{
      height: '100%',
      background: '#FFFFFF',
      border: '1px solid #DEDEDE',
      transition: 'all 0.3s ease',
      '&:hover': {
        boxShadow: '0 8px 16px rgba(235, 140, 0, 0.15)',
        transform: 'translateY(-2px)',
        borderColor: color,
      },
    }}
  >
    <CardContent>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
        <Box>
          <Typography color="textSecondary" variant="body2" sx={{ mb: 1 }}>
            {title}
          </Typography>
          <Typography variant="h4" sx={{ fontWeight: 700, color: color }}>
            {value.toLocaleString()}
          </Typography>
        </Box>
        <Icon sx={{ fontSize: 48, color, opacity: 0.15 }} />
      </Box>
      {trend && (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <TrendingUp sx={{ fontSize: 16, color: trend === 'up' ? '#10b981' : '#E0301E' }} />
          <Typography
            variant="body2"
            sx={{ color: trend === 'up' ? '#10b981' : '#E0301E', fontWeight: 600 }}
          >
            {trend === 'up' ? '+' : '-'}{trendValue}% Last 30 days
          </Typography>
        </Box>
      )}
    </CardContent>
  </Card>
);

const Dashboard = () => {
  const [stats, setStats] = useState({
    vehicles: 0,
    inventory: 0,
    trips: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Mock chart data
  const sessionsData = [
    { name: 'Mon', sessions: 2400, users: 1200 },
    { name: 'Tue', sessions: 3200, users: 1800 },
    { name: 'Wed', sessions: 2800, users: 1500 },
    { name: 'Thu', sessions: 3800, users: 2000 },
    { name: 'Fri', sessions: 4200, users: 2200 },
    { name: 'Sat', sessions: 3900, users: 1900 },
    { name: 'Sun', sessions: 4500, users: 2400 },
  ];

  const pageViewsData = [
    { month: 'Jan', views: 5000, downloads: 2400 },
    { month: 'Feb', views: 6000, downloads: 2800 },
    { month: 'Mar', views: 7200, downloads: 3100 },
    { month: 'Apr', views: 8100, downloads: 3400 },
    { month: 'May', views: 8900, downloads: 3800 },
    { month: 'Jun', views: 9200, downloads: 4100 },
  ];

  const statusData = [
    { name: 'In Transit', value: 35 },
    { name: 'Completed', value: 45 },
    { name: 'Pending', value: 15 },
    { name: 'Delayed', value: 5 },
  ];

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        const [vehiclesRes, inventoryRes, tripsRes] = await Promise.all([
          vehiclesAPI.getAllVehicles().catch(() => ({ data: [] })),
          inventoryAPI.getAllInventory().catch(() => ({ data: [] })),
          tripsAPI.getAllTrips().catch(() => ({ data: [] })),
        ]);

        const vehicleData = Array.isArray(vehiclesRes.data) ? vehiclesRes.data : vehiclesRes.data?.data || [];
        const inventoryData = Array.isArray(inventoryRes.data) ? inventoryRes.data : inventoryRes.data?.data || [];
        const tripData = Array.isArray(tripsRes.data) ? tripsRes.data : tripsRes.data?.data || [];

        setStats({
          vehicles: vehicleData.length,
          inventory: inventoryData.length,
          trips: tripData.length,
        });
        setError(null);
      } catch (err) {
        console.error('Error fetching stats:', err);
        setError('Failed to load statistics');
        setStats({
          vehicles: 0,
          inventory: 0,
          trips: 0,
        });
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  const recentTrips = [
    { id: 1, trip: 'TRIP-001', origin: 'San Francisco', destination: 'Los Angeles', status: 'In Transit', progress: 65 },
    { id: 2, trip: 'TRIP-002', origin: 'Los Angeles', destination: 'San Diego', status: 'Completed', progress: 100 },
    { id: 3, trip: 'TRIP-003', origin: 'San Jose', destination: 'Oakland', status: 'Pending', progress: 0 },
  ];

  return (
    <Box sx={{ p: 0, height: '100%', display: 'flex', flexDirection: 'column', bgcolor: 'background.default' }}>
      {/* Header Section */}
      <Box sx={{ p: 4, pb: 3, borderBottom: '1px solid', borderColor: '#DEDEDE', backgroundColor: '#FFFFFF' }}>
        <Typography variant="h4" sx={{ fontWeight: 700, mb: 0.5, color: '#000000' }}>
          Dashboard
        </Typography>
        <Typography color="textSecondary" variant="body2">
          Welcome back! Here's a summary of your supply chain metrics.
        </Typography>
      </Box>

      {/* Scrollable Content */}
      <Box sx={{ flex: 1, overflow: 'auto', p: 4, display: 'flex', flexDirection: 'column', gap: 4 }}>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', flex: 1 }}>
            <CircularProgress />
          </Box>
        ) : (
          <>
            {/* Stats Cards - 3 Column - Centered and Responsive */}
            <Grid container spacing={3} sx={{ justifyContent: 'center' }}>
              <Grid item xs={12} sm={6} md={5} lg={4}>
                <StatCard
                  title="Active Vehicles"
                  value={stats.vehicles}
                  icon={LocalShipping}
                  color="#EB8C00"
                  trend="up"
                  trendValue={25}
                />
              </Grid>
              <Grid item xs={12} sm={6} md={5} lg={4}>
                <StatCard
                  title="Inventory Items"
                  value={stats.inventory}
                  icon={Inventory}
                  color="#FFB600"
                  trend="up"
                  trendValue={15}
                />
              </Grid>
              <Grid item xs={12} sm={6} md={5} lg={4}>
                <StatCard
                  title="Active Trips"
                  value={stats.trips}
                  icon={DirectionsRun}
                  color="#E0301E"
                  trend="down"
                  trendValue={8}
                />
              </Grid>
            </Grid>

            {/* Charts - Full Width Row */}
            <Grid container spacing={3} sx={{ justifyContent: 'center' }}>
              <Grid item xs={12} lg={6}>
                <Paper sx={{ p: 3, height: '100%' }}>
                  <Typography variant="h6" sx={{ fontWeight: 700, mb: 3 }}>
                    Trips per Day
                  </Typography>
                  <ResponsiveContainer width="100%" height={280}>
                    <LineChart data={sessionsData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#DEDEDE" />
                      <XAxis dataKey="name" stroke="#464646" />
                      <YAxis stroke="#464646" />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#FFFFFF',
                          border: '1px solid #DEDEDE',
                          borderRadius: '8px',
                        }}
                      />
                      <Legend />
                      <Line
                        type="monotone"
                        dataKey="sessions"
                        stroke="#EB8C00"
                        strokeWidth={2}
                        name="Trips"
                        dot={false}
                      />
                      <Line
                        type="monotone"
                        dataKey="users"
                        stroke="#FFB600"
                        strokeWidth={2}
                        name="Vehicles"
                        dot={false}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </Paper>
              </Grid>

              <Grid item xs={12} lg={6}>
                <Paper sx={{ p: 3, height: '100%' }}>
                  <Typography variant="h6" sx={{ fontWeight: 700, mb: 3 }}>
                    Inventory Trends
                  </Typography>
                  <ResponsiveContainer width="100%" height={280}>
                    <BarChart data={pageViewsData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#DEDEDE" />
                      <XAxis dataKey="month" stroke="#464646" />
                      <YAxis stroke="#464646" />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#FFFFFF',
                          border: '1px solid #DEDEDE',
                          borderRadius: '8px',
                        }}
                      />
                      <Legend />
                      <Bar dataKey="views" fill="#EB8C00" name="Stock Items" radius={[8, 8, 0, 0]} />
                      <Bar dataKey="downloads" fill="#FFB600" name="Low Stock" radius={[8, 8, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </Paper>
              </Grid>
            </Grid>

            {/* Bottom Row - Pie Chart and Table */}
            <Grid container spacing={3} sx={{ justifyContent: 'center' }}>
              <Grid item xs={12} lg={5}>
                <Paper sx={{ p: 3, height: '100%' }}>
                  <Typography variant="h6" sx={{ fontWeight: 700, mb: 3 }}>
                    Trip Status Distribution
                  </Typography>
                  <ResponsiveContainer width="100%" height={280}>
                    <PieChart>
                      <Pie
                        data={statusData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {statusData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </Paper>
              </Grid>

              <Grid item xs={12} lg={7}>
                <Paper sx={{ overflow: 'hidden' }}>
                  <Box sx={{ p: 3, borderBottom: '1px solid #DEDEDE' }}>
                    <Typography variant="h6" sx={{ fontWeight: 700 }}>
                      Recent Trips
                    </Typography>
                  </Box>
                  <TableContainer>
                    <Table size="small">
                      <TableHead>
                        <TableRow sx={{ backgroundColor: '#F9F9F9' }}>
                          <TableCell sx={{ fontWeight: 700, color: '#EB8C00' }}>Trip ID</TableCell>
                          <TableCell sx={{ fontWeight: 700, color: '#EB8C00' }}>Route</TableCell>
                          <TableCell sx={{ fontWeight: 700, color: '#EB8C00' }}>Status</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {recentTrips.map((trip) => (
                          <TableRow key={trip.id} sx={{ '&:hover': { backgroundColor: '#F9F9F9' } }}>
                            <TableCell sx={{ fontWeight: 600, color: '#EB8C00' }}>{trip.trip}</TableCell>
                            <TableCell>{trip.origin} → {trip.destination}</TableCell>
                            <TableCell>
                              <Chip
                                label={trip.status}
                                size="small"
                                variant="filled"
                                color={
                                  trip.status === 'In Transit'
                                    ? 'primary'
                                    : trip.status === 'Completed'
                                    ? 'success'
                                    : 'warning'
                                }
                                sx={{ fontWeight: 600 }}
                              />
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Paper>
              </Grid>
            </Grid>
          </>
        )}
      </Box>
    </Box>
  );
};

export default Dashboard;

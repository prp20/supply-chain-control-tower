import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Grid,
  Paper,
  Typography,
  Chip,
  CircularProgress,
  Alert,
  Button,
  Card,
  CardContent,
  LinearProgress,
  ButtonGroup,
} from '@mui/material';
import { ArrowBack, PlayArrow, Stop, Videocam } from '@mui/icons-material';
import MapComponent from '../components/MapComponent';
import { tripsAPI } from '../services/api';
import { useRedisStream } from '../hooks/useRedisStream';

const TripDetail = () => {
  const { tripId } = useParams();
  const navigate = useNavigate();
  const simulationIntervalRef = useRef(null);
  
  const [trip, setTrip] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [routes, setRoutes] = useState([]);
  const [mapCenter, setMapCenter] = useState([37.7749, -122.4194]);
  const [vehicleMarker, setVehicleMarker] = useState(null);
  const [activeVehicleStream, setActiveVehicleStream] = useState(null);
  const [isLiveTracking, setIsLiveTracking] = useState(false);
  const [isSimulating, setIsSimulating] = useState(false);
  const [traveledRoute, setTraveledRoute] = useState(null);
  const [fullRouteCoordinates, setFullRouteCoordinates] = useState([]);
  const [currentRouteIndex, setCurrentRouteIndex] = useState(0);

  // Helper function to calculate distance between two coordinates (in km)
  const calculateDistance = (lat1, lng1, lat2, lng2) => {
    const R = 6371;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLng = ((lng2 - lng1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLng / 2) * Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  // Helper function to find the closest point on route to vehicle position
  const findClosestPointIndex = (vehicleLat, vehicleLng, routeCoordinates) => {
    let minDistance = Infinity;
    let closestIndex = 0;

    routeCoordinates.forEach((coord, idx) => {
      const distance = calculateDistance(vehicleLat, vehicleLng, coord[1], coord[0]);
      if (distance < minDistance) {
        minDistance = distance;
        closestIndex = idx;
      }
    });

    return closestIndex;
  };

  // Helper function to calculate traveled route
  const calculateTraveledRoute = (vehicleLat, vehicleLng, fullCoordinates) => {
    if (!fullCoordinates || fullCoordinates.length < 2) {
      return null;
    }

    const closestIndex = findClosestPointIndex(vehicleLat, vehicleLng, fullCoordinates);
    const traveledCoordinates = fullCoordinates.slice(0, closestIndex + 1);
    
    if (traveledCoordinates.length === 0 || 
        traveledCoordinates[traveledCoordinates.length - 1][0] !== vehicleLng ||
        traveledCoordinates[traveledCoordinates.length - 1][1] !== vehicleLat) {
      traveledCoordinates.push([vehicleLng, vehicleLat]);
    }

    if (traveledCoordinates.length < 2) {
      return null;
    }

    return {
      coordinates: traveledCoordinates,
      color: '#4ade80',
      weight: 5,
      opacity: 0.9,
    };
  };

  // Handle Redis stream events
  const handleStreamEvent = (data) => {
    if (!isLiveTracking || !data.stream || !trip || !activeVehicleStream) {
      return;
    }

    if (data.stream.includes(activeVehicleStream)) {
      const payload = data.payload;

      if (payload.lat !== undefined && payload.long !== undefined) {
        const vehicleLat = parseFloat(payload.lat);
        const vehicleLng = parseFloat(payload.long);

        setVehicleMarker({
          lat: vehicleLat,
          lng: vehicleLng,
          name: payload.vehicle_make || 'Vehicle',
          status: payload.status || 'In Transit',
          speed: payload.speed,
          bearing: payload.bearing,
        });

        if (fullRouteCoordinates.length > 0) {
          const traveled = calculateTraveledRoute(vehicleLat, vehicleLng, fullRouteCoordinates);
          if (traveled) {
            setTraveledRoute(traveled);
          }
        }
      }
    }
  };

  const { subscribe } = useRedisStream(handleStreamEvent);

  // Fetch trip details
  useEffect(() => {
    const fetchTripDetail = async () => {
      try {
        setLoading(true);
        const response = await tripsAPI.getTripById(tripId);
        const tripDetail = response.data;

        // Transform trip data
        const transformedTrip = {
          id: tripDetail.trip_id,
          trip_id: `TRIP-${String(tripDetail.trip_id).padStart(3, '0')}`,
          vehicle_id: tripDetail.vehicle_id,
          vehicle_make: tripDetail.vehicle_make,
          start_lat: tripDetail.start_lat,
          start_long: tripDetail.start_long,
          dest_lat: tripDetail.dest_lat,
          dest_long: tripDetail.dest_long,
        };

        setTrip(transformedTrip);

        // Subscribe to vehicle stream
        const vehicleStreamPattern = `vehicle.events.${tripDetail.vehicle_id}`;
        setActiveVehicleStream(vehicleStreamPattern);
        subscribe(vehicleStreamPattern);

        // Initialize vehicle marker
        if (tripDetail.start_lat && tripDetail.start_long) {
          setVehicleMarker({
            lat: parseFloat(tripDetail.start_lat),
            lng: parseFloat(tripDetail.start_long),
            name: tripDetail.vehicle_make || 'Vehicle',
            status: 'Starting Route',
          });
        }

        // Handle route geometry
        if (tripDetail.route && tripDetail.route.geometry) {
          const geometry = tripDetail.route.geometry;
          let routeCoordinates = [];

          if (geometry.type === 'LineString' && geometry.coordinates) {
            routeCoordinates = geometry.coordinates;
          } else if (Array.isArray(geometry.coordinates)) {
            routeCoordinates = geometry.coordinates;
          }

          if (routeCoordinates.length > 0) {
            setFullRouteCoordinates(routeCoordinates);
            setTraveledRoute(null);

            const route = {
              coordinates: routeCoordinates,
              color: '#667eea',
              weight: 3,
              opacity: 0.5,
              label: transformedTrip.trip_id,
              description: `Trip from start to destination`,
              distance: tripDetail.route.distance_km,
              duration: tripDetail.route.duration_minutes,
            };

            setRoutes([route]);

            const centerLat = routeCoordinates.reduce((sum, coord) => sum + coord[1], 0) / routeCoordinates.length;
            const centerLng = routeCoordinates.reduce((sum, coord) => sum + coord[0], 0) / routeCoordinates.length;
            setMapCenter([centerLat, centerLng]);
          }
        }

        setError(null);
      } catch (err) {
        console.error('Error fetching trip details:', err);
        setError('Failed to load trip details');
      } finally {
        setLoading(false);
      }
    };

    fetchTripDetail();
  }, [tripId, subscribe]);

  // Start simulation of vehicle movement along route
  const startSimulation = () => {
    if (!fullRouteCoordinates || fullRouteCoordinates.length === 0) return;
    
    setIsSimulating(true);
    let currentIndex = 0;
    
    simulationIntervalRef.current = setInterval(() => {
      if (currentIndex >= fullRouteCoordinates.length - 1) {
        // Stop simulation when reaching the end
        stopSimulation();
        return;
      }
      
      currentIndex += 1;
      const coord = fullRouteCoordinates[currentIndex];
      
      // Update vehicle marker position
      const newMarker = {
        lat: coord[1],
        lng: coord[0],
        name: trip?.vehicle_make || 'Vehicle',
        status: 'Simulating',
        speed: Math.random() * 80 + 30, // Random speed between 30-110 km/h
      };
      setVehicleMarker(newMarker);
      
      // Update map center to follow vehicle
      setMapCenter([coord[1], coord[0]]);
      
      // Update traveled route
      const traveled = calculateTraveledRoute(coord[1], coord[0], fullRouteCoordinates);
      if (traveled) {
        setTraveledRoute(traveled);
      }
      
      setCurrentRouteIndex(currentIndex);
    }, 500); // Update every 500ms
  };

  // Stop simulation
  const stopSimulation = () => {
    setIsSimulating(false);
    if (simulationIntervalRef.current) {
      clearInterval(simulationIntervalRef.current);
      simulationIntervalRef.current = null;
    }
  };

  // Toggle live GPS tracking
  const toggleLiveTracking = () => {
    if (!isLiveTracking && activeVehicleStream) {
      setIsLiveTracking(true);
      subscribe(activeVehicleStream);
    } else {
      setIsLiveTracking(false);
      stopSimulation(); // Stop simulation if switching to live
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (simulationIntervalRef.current) {
        clearInterval(simulationIntervalRef.current);
      }
    };
  }, []);

  const getStatusColor = (status) => {
    if (!status) return 'default';
    const statusStr = status.toLowerCase();
    if (statusStr.includes('completed')) return 'success';
    if (statusStr.includes('in transit')) return 'primary';
    if (statusStr.includes('pending')) return 'warning';
    return 'default';
  };

  if (loading) {
    return (
      <Box sx={{ p: 3, display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Button startIcon={<ArrowBack />} onClick={() => navigate('/trips')} sx={{ mb: 2 }}>
          Back to Trips
        </Button>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3, backgroundColor: '#0f1419', minHeight: '100vh' }}>
      {/* Back Button */}
      <Button 
        startIcon={<ArrowBack />} 
        onClick={() => navigate('/trips')}
        sx={{ mb: 2, color: '#667eea' }}
      >
        Back to Trips
      </Button>

      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 700, color: '#667eea', mb: 1 }}>
          Trip Details: {trip?.trip_id} 
          {isLiveTracking && <span style={{ marginLeft: '10px', color: '#4ade80', fontSize: '0.8em' }}>🔴 Live Tracking</span>}
          {isSimulating && <span style={{ marginLeft: '10px', color: '#f59e0b', fontSize: '0.8em' }}>▶ Simulating</span>}
        </Typography>
        
        {/* Control Buttons */}
        <ButtonGroup variant="outlined" size="small" sx={{ mt: 2 }}>
          <Button
            startIcon={isSimulating ? <Stop /> : <PlayArrow />}
            onClick={isSimulating ? stopSimulation : startSimulation}
            sx={{
              color: isSimulating ? '#ef4444' : '#667eea',
              borderColor: isSimulating ? '#ef4444' : '#667eea',
              '&:hover': {
                backgroundColor: isSimulating ? 'rgba(239, 68, 68, 0.1)' : 'rgba(102, 126, 234, 0.1)',
              },
            }}
          >
            {isSimulating ? 'Stop Simulation' : 'Start Simulation'}
          </Button>
          <Button
            startIcon={<Videocam />}
            onClick={toggleLiveTracking}
            sx={{
              color: isLiveTracking ? '#4ade80' : '#667eea',
              borderColor: isLiveTracking ? '#4ade80' : '#667eea',
              '&:hover': {
                backgroundColor: isLiveTracking ? 'rgba(74, 222, 128, 0.1)' : 'rgba(102, 126, 234, 0.1)',
              },
            }}
          >
            {isLiveTracking ? 'Stop Live Stream' : 'Start Live Stream'}
          </Button>
        </ButtonGroup>
      </Box>

      {/* Map Container - Always render */}
      <Paper sx={{ p: 0, height: '600px', background: '#1a1f2e', border: '1px solid #2a3142', overflow: 'hidden', mb: 3 }}>
        {fullRouteCoordinates.length > 0 ? (
          <MapComponent 
            routes={routes} 
            center={mapCenter} 
            zoom={8} 
            vehicleMarker={vehicleMarker} 
            traveledRoute={traveledRoute}
            showLegend={true}
          />
        ) : (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
            <Typography color="textSecondary">Loading map data...</Typography>
          </Box>
        )}
      </Paper>

      {/* Stats Grid - centered and responsive */}
      <Grid container spacing={3} sx={{ justifyContent: 'center', mb: 3 }}>
        {/* Trip Information Card */}
        <Grid item xs={12} sm={10} md={5}>
          <Paper sx={{ p: 3, background: '#1a1f2e', border: '1px solid #2a3142' }}>
            <Typography variant="h6" sx={{ fontWeight: 700, color: '#667eea', mb: 2 }}>
              Trip Information
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Box>
                <Typography variant="caption" color="textSecondary">From</Typography>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>Starting Location</Typography>
              </Box>
              <Box>
                <Typography variant="caption" color="textSecondary">To</Typography>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>Destination</Typography>
              </Box>
              <Box>
                <Typography variant="caption" color="textSecondary">Vehicle</Typography>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>{trip?.vehicle_make}</Typography>
              </Box>
              <Box>
                <Typography variant="caption" color="textSecondary">Status</Typography>
                <Chip
                  label={isLiveTracking ? 'Live Tracking' : isSimulating ? 'Simulating' : 'Active'}
                  color={isLiveTracking || isSimulating ? 'primary' : 'default'}
                  size="small"
                  sx={{ fontWeight: 600, mt: 0.5 }}
                />
              </Box>
            </Box>
          </Paper>
        </Grid>

        {/* Route Information Card */}
        <Grid item xs={12} sm={10} md={5}>
          <Paper sx={{ p: 3, background: '#1a1f2e', border: '1px solid #2a3142' }}>
            <Typography variant="h6" sx={{ fontWeight: 700, color: '#667eea', mb: 2 }}>
              Route Details
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {vehicleMarker && (
                <>
                  <Box>
                    <Typography variant="caption" color="textSecondary">Current Speed</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600, color: '#667eea' }}>
                      {vehicleMarker.speed ? `${vehicleMarker.speed} km/h` : 'N/A'}
                    </Typography>
                  </Box>
                </>
              )}
              <Box>
                <Typography variant="caption" color="textSecondary">Total Distance</Typography>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  {routes[0]?.distance ? `${routes[0].distance.toFixed(2)} km` : 'Calculating...'}
                </Typography>
              </Box>
              <Box>
                <Typography variant="caption" color="textSecondary">Est. Duration</Typography>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  {routes[0]?.duration ? `${routes[0].duration.toFixed(0)} mins` : 'Calculating...'}
                </Typography>
              </Box>
              {traveledRoute && (
                <Box>
                  <Typography variant="caption" color="textSecondary">Progress</Typography>
                  <LinearProgress
                    variant="determinate"
                    value={
                      routes[0]?.distance
                        ? ((traveledRoute.coordinates.length / routes[0].distance) * 100).toFixed(0)
                        : 0
                    }
                    sx={{
                      height: 6,
                      borderRadius: 3,
                      backgroundColor: '#252d3d',
                      mt: 0.5,
                      '& .MuiLinearProgress-bar': {
                        background: 'linear-gradient(90deg, #4ade80 0%, #22c55e 100%)',
                      },
                    }}
                  />
                  <Typography variant="caption" color="#4ade80" sx={{ mt: 0.5 }}>
                    {traveledRoute.coordinates.length > 0 && routes[0]?.distance
                      ? `${((traveledRoute.coordinates.length / routes[0].distance) * 100).toFixed(1)}% Traveled`
                      : 'Tracking...'}
                  </Typography>
                </Box>
              )}
            </Box>
          </Paper>
        </Grid>

        {/* Map Legend Info Card */}
        <Grid item xs={12} sm={10} md={10} sx={{ justifyContent: 'center' }}>
          <Paper sx={{ p: 3, background: '#1a1f2e', border: '1px solid #2a3142' }}>
            <Typography variant="h6" sx={{ fontWeight: 700, color: '#667eea', mb: 2 }}>
              Map Legend & Status
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6} md={3}>
                <Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                    <Box sx={{ width: 16, height: 2, backgroundColor: '#667eea' }} />
                    <Typography variant="body2">Planned Route</Typography>
                  </Box>
                  <Typography variant="caption" color="textSecondary">
                    Full route from start to destination
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                    <Box sx={{ width: 16, height: 2, backgroundColor: '#4ade80' }} />
                    <Typography variant="body2">Distance Traveled</Typography>
                  </Box>
                  <Typography variant="caption" color="textSecondary">
                    Completed portion of route
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                    <Box sx={{ width: 10, height: 10, backgroundColor: 'rgb(100, 150, 200)', borderRadius: '50%' }} />
                    <Typography variant="body2">Vehicle Position</Typography>
                  </Box>
                  <Typography variant="caption" color="textSecondary">
                    Real-time GPS location
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                    <Box sx={{ width: 16, height: 2, backgroundColor: '#94a3b8', opacity: 0.3 }} />
                    <Typography variant="body2">Remaining Route</Typography>
                  </Box>
                  <Typography variant="caption" color="textSecondary">
                    Yet to be traveled
                  </Typography>
                </Box>
              </Grid>
            </Grid>
            
            {/* Current Status */}
            <Box sx={{ mt: 3, pt: 2, borderTop: '1px solid #2a3142' }}>
              <Typography variant="body2" sx={{ fontWeight: 600, mb: 1 }}>Current Mode:</Typography>
              <Box sx={{ display: 'flex', gap: 1 }}>
                {isLiveTracking && (
                  <Chip label="🔴 Live GPS Tracking" color="success" size="small" variant="outlined" />
                )}
                {isSimulating && (
                  <Chip label="▶ Route Simulation" color="warning" size="small" variant="outlined" />
                )}
                {!isLiveTracking && !isSimulating && (
                  <Chip label="⏸ Idle" size="small" variant="outlined" />
                )}
              </Box>
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default TripDetail;

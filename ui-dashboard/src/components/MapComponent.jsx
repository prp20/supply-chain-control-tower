import React, { useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Popup, Polyline, Marker } from 'react-leaflet';
import L from 'leaflet';
import { Box, Paper, Typography } from '@mui/material';
import 'leaflet/dist/leaflet.css';

// Fix leaflet icon issue
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.3.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.3.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.3.1/images/marker-shadow.png',
});

// Create custom vehicle icon
const vehicleIcon = L.icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

// Map Legend Component
const MapLegend = () => (
  <Paper
    sx={{
      position: 'absolute',
      bottom: 20,
      left: 20,
      zIndex: 1000,
      backgroundColor: '#1a1f2e',
      border: '2px solid #2a3142',
      borderRadius: 1,
      padding: 2,
      maxWidth: 250,
    }}
  >
    <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1.5, color: '#667eea' }}>
      Route Legend
    </Typography>
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
        <Box sx={{ width: 20, height: 3, backgroundColor: '#667eea', borderRadius: 1 }} />
        <Typography variant="body2" color="textSecondary">Planned Route</Typography>
      </Box>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
        <Box sx={{ width: 20, height: 3, backgroundColor: '#4ade80', borderRadius: 1 }} />
        <Typography variant="body2" color="textSecondary">Distance Traveled</Typography>
      </Box>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
        <Box
          sx={{
            width: 12,
            height: 12,
            backgroundColor: 'rgb(100, 150, 200)',
            borderRadius: '50%',
            border: '2px solid white',
          }}
        />
        <Typography variant="body2" color="textSecondary">Vehicle Position</Typography>
      </Box>
    </Box>
  </Paper>
);

const MapComponent = ({ routes = [], center = [37.7749, -122.4194], zoom = 12, vehicleMarker = null, traveledRoute = null, showLegend = true }) => {
  const mapRef = useRef(null);
  const markerRef = useRef(null);

  const defaultCenter = [37.7749, -122.4194];
  const displayCenter = center && center.length === 2 ? center : defaultCenter;

  useEffect(() => {
    // Animate vehicle marker if present
    if (markerRef.current && vehicleMarker && vehicleMarker.lat && vehicleMarker.lng) {
      const newLatLng = L.latLng(vehicleMarker.lat, vehicleMarker.lng);
      
      // Smooth animation to new position
      markerRef.current.setLatLng(newLatLng);

      // Rotate marker based on bearing if available
      if (vehicleMarker.bearing !== undefined && markerRef.current._icon) {
        markerRef.current._icon.style.transform = `rotate(${vehicleMarker.bearing}deg)`;
      }
    }
  }, [vehicleMarker]);

  return (
    <Box
      sx={{
        width: '100%',
        height: '100%',
        borderRadius: 1,
        overflow: 'hidden',
        boxShadow: 2,
        position: 'relative',
      }}
    >
      <MapContainer
        center={displayCenter}
        zoom={zoom}
        scrollWheelZoom={true}
        style={{ width: '100%', height: '100%' }}
        ref={mapRef}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />

        {/* Vehicle marker with real-time position */}
        {vehicleMarker && vehicleMarker.lat && vehicleMarker.lng && (
          <Marker
            position={[vehicleMarker.lat, vehicleMarker.lng]}
            icon={vehicleIcon}
            ref={markerRef}
          >
            <Popup>
              <div>
                <strong>{vehicleMarker.name || 'Vehicle'}</strong>
                <p>Status: {vehicleMarker.status || 'In Transit'}</p>
                <p>Speed: {vehicleMarker.speed ? `${vehicleMarker.speed} km/h` : 'N/A'}</p>
              </div>
            </Popup>
          </Marker>
        )}

        {/* Render traveled portion of route in green */}
        {traveledRoute && traveledRoute.coordinates && traveledRoute.coordinates.length > 0 && (
          <Polyline
            positions={traveledRoute.coordinates.map((coord) => [coord[1], coord[0]])}
            color="#4ade80"
            weight={5}
            opacity={0.9}
            lineCap="round"
            lineJoin="round"
          >
            <Popup>
              <div>
                <strong>Distance Traveled</strong>
              </div>
            </Popup>
          </Polyline>
        )}

        {/* Render full routes */}
        {routes && routes.map((route, idx) => {
          if (!route.coordinates || route.coordinates.length === 0) {
            return null;
          }

          // Convert GeoJSON format [lng, lat] to Leaflet format [lat, lng]
          const positions = route.coordinates.map((coord) => {
            if (Array.isArray(coord)) {
              // If it's [lng, lat], convert to [lat, lng]
              return [coord[1], coord[0]];
            }
            return coord;
          });

          return (
            <Polyline
              key={idx}
              positions={positions}
              color={route.color || '#2196F3'}
              weight={route.weight || 3}
              opacity={route.opacity || 0.5}
              dashArray={route.dashArray}
              lineCap="round"
              lineJoin="round"
            >
              {route.label && (
                <Popup>
                  <div>
                    <strong>{route.label}</strong>
                    <p>{route.description}</p>
                  </div>
                </Popup>
              )}
            </Polyline>
          );
        })}

        {/* Map Legend */}
        {showLegend && <MapLegend />}
      </MapContainer>
    </Box>
  );
};

export default MapComponent;


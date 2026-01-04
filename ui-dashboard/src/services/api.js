import axios from 'axios';

// API Gateway base URL - adjust based on your environment
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for adding auth token if needed
api.interceptors.request.use(
  (config) => {
    // You can add authorization headers here if needed
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error:', error);
    return Promise.reject(error);
  }
);

// Trips API
export const tripsAPI = {
  getAllTrips: () => api.get('/trips'),
  getTripById: (id) => api.get(`/trip/${id}`),
  createTrip: (data) => api.post('/trips', data),
  updateTrip: (id, data) => api.put(`/trips/${id}`, data),
  deleteTrip: (id) => api.delete(`/trips/${id}`),
};

// Inventory API
export const inventoryAPI = {
  getAllInventory: () => api.get('/inventory'),
  getInventoryById: (id) => api.get(`/inventory/${id}`),
  updateInventory: (id, data) => api.put(`/inventory/${id}`, data),
};

// Vehicles API
export const vehiclesAPI = {
  getAllVehicles: () => api.get('/vehicles'),
  getVehicleById: (id) => api.get(`/vehicles/${id}`),
  updateVehicle: (id, data) => api.put(`/vehicles/${id}`, data),
};

// Health check
export const healthAPI = {
  check: () => api.get('/health'),
};

export default api;

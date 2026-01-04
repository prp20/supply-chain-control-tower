# Supply Chain Dashboard - React UI

A professional, responsive React dashboard built with Vite, Material-UI, and Leaflet for supply chain management and logistics tracking.

## 🚀 Features

### Phase 1 - React + Leaflet Foundation (Completed)

- ✅ **Vite-based React Application** - Fast, modern development experience
- ✅ **Responsive Design** - Works seamlessly on desktop, tablet, and mobile devices
- ✅ **Material-UI Components** - Professional, accessible UI components
- ✅ **Dynamic Navbar** - Header with user menu
- ✅ **Sidebar Navigation** - Collapsible sidebar for desktop, drawer for mobile
- ✅ **Multiple Pages**:
  - Dashboard: Overview statistics and key metrics
  - Trips: Trip management with route visualization
  - Inventory: Inventory tracking with status monitoring
  - AI Analysis: AI-powered insights and recommendations
  - Settings: Application configuration
- ✅ **Leaflet Map Integration** - Interactive maps with route visualization
- ✅ **API Gateway Integration** - Axios-based API client with error handling
- ✅ **OSRM Route Rendering** - Static route visualization on maps

## 📋 Prerequisites

- Node.js >= 16.x
- npm >= 8.x or yarn >= 3.x

## 🛠️ Installation

1. **Navigate to the project directory:**
   ```bash
   cd ui-dashboard
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure environment variables:**
   - Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```
   - Update `VITE_API_URL` to match your API Gateway URL

4. **Start the development server:**
   ```bash
   npm run dev
   ```

The application will be available at `http://localhost:5173`

## 📦 Build for Production

```bash
npm run build
```

Preview the production build:
```bash
npm run preview
```

## 🏗️ Project Structure

```
ui-dashboard/
├── src/
│   ├── components/          # Reusable React components
│   │   ├── Navbar.jsx      # Top navigation bar
│   │   ├── Sidebar.jsx     # Left sidebar navigation
│   │   └── MapComponent.jsx # Leaflet map wrapper
│   ├── pages/              # Page components
│   │   ├── Dashboard.jsx   # Main dashboard
│   │   ├── Trips.jsx       # Trips management
│   │   ├── Inventory.jsx   # Inventory tracking
│   │   ├── AIAnalysis.jsx  # AI insights
│   │   └── Settings.jsx    # App settings
│   ├── services/           # API clients
│   │   └── api.js          # Axios API configuration
│   ├── hooks/              # Custom React hooks
│   ├── styles/             # Global styles
│   ├── App.jsx             # Main app component
│   ├── App.css             # Global styles
│   └── main.jsx            # Entry point
├── public/                 # Static assets
├── index.html             # HTML template
├── vite.config.js         # Vite configuration
├── package.json           # Dependencies
├── .env                   # Environment variables
└── README.md              # This file
```

## 🎨 Responsive Design

The dashboard is fully responsive with breakpoints for:
- **Mobile (xs)**: < 600px
- **Tablet (sm)**: 600px - 960px
- **Small Desktop (md)**: 960px - 1264px
- **Large Desktop (lg)**: > 1264px

### Layout Behavior:
- **Mobile**: Sidebar as collapsible drawer, full-width content
- **Tablet**: Reduced padding, optimized spacing
- **Desktop**: Persistent sidebar, optimal spacing

## 🔌 API Integration

### Configuration

The API client uses environment variables for configuration:

```env
VITE_API_URL=http://localhost:8000
```

### API Endpoints

The dashboard integrates with the following endpoints:

- `GET /trips` - Fetch all trips
- `GET /trips/{id}` - Fetch specific trip
- `GET /inventory` - Fetch inventory items
- `GET /inventory/{id}` - Fetch specific inventory
- `GET /vehicles` - Fetch all vehicles
- `GET /vehicles/{id}` - Fetch specific vehicle
- `GET /health` - Health check

See `src/services/api.js` for API client implementation.

## 🗺️ Map Features

### Map Component Props

```jsx
<MapComponent
  routes={[
    {
      coordinates: [[37.7749, -122.4194], [34.0522, -118.2437]],
      color: '#2196F3',
      weight: 3,
      opacity: 0.8,
      label: 'Route 1',
      description: 'SF to LA'
    }
  ]}
  center={[37.7749, -122.4194]}
  zoom={12}
/>
```

### OSRM Route Integration

Replace mock route data with actual OSRM responses:

```javascript
// In Trips.jsx, replace mock route with actual OSRM data
const osmRoute = {
  coordinates: response.routes[0].geometry.coordinates.map(
    ([lng, lat]) => [lat, lng]
  ),
  color: '#2196F3',
  weight: 3,
  opacity: 0.8,
  label: trip.trip_id,
  description: `${trip.origin} → ${trip.destination}`
};
```

## 📱 Mobile Optimization

- Touch-friendly interface
- Optimized Navbar and Sidebar for mobile
- Responsive tables with horizontal scroll on small screens
- Proper spacing and padding for readability

## 🎯 Navigation

### Main Routes

- `/` - Dashboard
- `/trips` - Trips Management
- `/inventory` - Inventory Management
- `/ai-analysis` - AI Analysis
- `/settings` - Settings

Navigation is handled by React Router with automatic sidebar updates based on current route.

## 🚀 Performance Optimizations

- Code splitting with React Router
- Lazy loading of pages
- Optimized re-renders with React.memo (where applicable)
- CSS-in-JS with MUI for minimal bundle size
- Vite's fast HMR (Hot Module Replacement)

## 🔐 Security Considerations

- Sanitize API responses
- Validate user inputs
- Use HTTPS in production
- Implement proper CORS policies
- Add authentication/authorization (future enhancement)

## 🐛 Troubleshooting

### Common Issues

1. **API Connection Failed**
   - Check `VITE_API_URL` in `.env`
   - Ensure API Gateway is running
   - Check CORS headers

2. **Map Not Loading**
   - Verify Leaflet CSS is imported
   - Check internet connection for tile layer
   - Verify coordinates format [latitude, longitude]

3. **Sidebar Not Responsive**
   - Clear browser cache
   - Check MUI breakpoints in theme
   - Verify screen width

## 📚 Dependencies

- **react** ^19.2.0 - React library
- **react-dom** ^19.2.0 - React DOM
- **react-router-dom** ^7.11.0 - Routing
- **@mui/material** ^7.3.6 - UI Components
- **@mui/icons-material** ^7.3.6 - Icons
- **leaflet** ^1.9.4 - Map library
- **react-leaflet** ^5.0.0 - React bindings for Leaflet
- **axios** ^1.13.2 - HTTP client
- **@emotion/react** & **@emotion/styled** - CSS-in-JS

## 🔄 Future Enhancements

- [ ] Authentication/Authorization
- [ ] Real-time data updates with WebSockets
- [ ] Advanced filtering and search
- [ ] Data export (PDF, CSV)
- [ ] Dark mode theme
- [ ] Performance monitoring
- [ ] PWA capabilities
- [ ] Multi-language support

## 📄 License

This project is part of the Supply Chain Management POC.

## 👥 Support

For issues or questions, please contact the development team.

---

**Last Updated**: January 2026
**Version**: 1.0.0

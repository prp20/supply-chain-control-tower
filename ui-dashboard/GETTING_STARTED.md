# 🚀 Supply Chain Dashboard - Getting Started Guide

## Overview

Your React-based Supply Chain Dashboard is now built with a **modern Material-UI dashboard theme** inspired by the official MUI dashboard template. The application is fully responsive and ready for development/production.

## 📁 Project Location

```
/home/prasad/dev_home/supply_chain_poc/ui-dashboard/
```

## ✨ What's Included

### Modern Theme Features
- ✅ **Gradient Color Scheme** - Purple to pink gradients matching MUI dashboard style
- ✅ **Professional Cards** - Elevated card designs with hover effects
- ✅ **Interactive Charts** - Recharts integration for data visualization
- ✅ **Responsive Sidebar** - Collapsible on mobile, persistent on desktop
- ✅ **Enhanced Navbar** - Search, notifications, and user menu
- ✅ **Data Tables** - Sortable, searchable tables with chip status indicators
- ✅ **Progress Indicators** - Linear progress bars for trip tracking
- ✅ **Gradient Backgrounds** - Modern gradient card backgrounds

### Key Pages

1. **Dashboard** (`/`)
   - Overview statistics with trend indicators
   - Line chart for daily trips
   - Bar chart for inventory trends
   - Pie chart for trip status distribution
   - Recent trips table

2. **Trips** (`/trips`)
   - Statistics cards for trip status
   - Search and filter functionality
   - Detailed trips table with progress tracking
   - Interactive map with route visualization
   - Modal dialog for route details

3. **Inventory** (`/inventory`)
   - Health status indicators
   - Dual view options (Grid/Table)
   - Stock level progress bars
   - Low stock warnings
   - Search functionality

4. **AI Analysis** (`/ai-analysis`)
   - Interactive query interface
   - Quick query suggestions
   - Colored insight cards
   - Recommendation list
   - Real-time analysis results

5. **Settings** (`/settings`)
   - API configuration
   - Feature toggles
   - About information
   - Feature highlights

## 🚀 Quick Start

### 1. Install Dependencies (if not already done)

```bash
cd ui-dashboard
npm install
```

### 2. Development Mode

Start the development server:

```bash
npm run dev
```

The app will be available at: **http://localhost:5173**

### 3. Build for Production

```bash
npm run build
npm run preview
```

## 🎨 Design System

### Color Palette

```javascript
Primary: #667eea (Purple)
Secondary: #764ba2 (Dark Purple)
Success: #43e97b (Green)
Warning: #fa709a (Pink)
Error: #ff6b6b (Red)
Info: #4facfe (Blue)
Background: #f5f7ff (Light Purple)
```

### Gradients Used

- **Header**: `linear-gradient(135deg, #667eea 0%, #764ba2 100%)`
- **Success Cards**: `linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)`
- **Info Cards**: `linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)`
- **Warning Cards**: `linear-gradient(135deg, #fa709a 0%, #fee140 100%)`

### Typography

- **Headers (h4)**: 700 weight, 24px
- **Subheaders (h6)**: 600 weight, 20px
- **Body**: 400 weight, 14px
- **Button**: 600 weight, uppercase alternative disabled

## 📱 Responsive Breakpoints

| Breakpoint | Width | Layout |
|-----------|-------|--------|
| Mobile (xs) | < 600px | Full width, collapsible sidebar |
| Tablet (sm) | 600-960px | Adjusted padding, flexible grid |
| Desktop (md) | 960-1264px | Persistent sidebar, full layout |
| Large (lg) | > 1264px | Optimized spacing, all features |

## 🔌 API Integration

### Environment Variables

Create a `.env` file in the `ui-dashboard` folder:

```env
VITE_API_URL=http://localhost:8000
VITE_APP_TITLE=Supply Chain Dashboard
VITE_APP_VERSION=1.0.0
VITE_MAP_CENTER_LAT=37.7749
VITE_MAP_CENTER_LNG=-122.4194
VITE_MAP_ZOOM=12
```

### API Endpoints Used

- `GET /trips` - Fetch all trips
- `GET /inventory` - Fetch inventory items
- `GET /vehicles` - Fetch vehicles
- `GET /health` - Health check

All endpoints are configured in: `src/services/api.js`

## 🗺️ Leaflet Map Integration

The dashboard includes an interactive map component:

```javascript
<MapComponent
  routes={[
    {
      coordinates: [[lat1, lng1], [lat2, lng2]],
      color: '#667eea',
      weight: 3,
      opacity: 0.8,
      label: 'Route Name'
    }
  ]}
  center={[37.7749, -122.4194]}
  zoom={12}
/>
```

### Mock Route Data

Currently using mock OSRM route data. To integrate real routes:

1. Call OSRM API: `https://router.project-osrm.org/route/v1/driving/{start};{end}`
2. Convert coordinates from [lng,lat] to [lat,lng]
3. Pass to MapComponent

## 📊 Charts Integration

Dashboard uses **Recharts** for visualizations:

- **LineChart**: Daily trips and vehicle metrics
- **BarChart**: Inventory trends
- **PieChart**: Trip status distribution

## 🎯 Component Structure

```
src/
├── components/
│   ├── Navbar.jsx          # Top navigation with search & user menu
│   ├── Sidebar.jsx         # Left navigation with routes
│   └── MapComponent.jsx    # Leaflet map wrapper
├── pages/
│   ├── Dashboard.jsx       # Main dashboard with stats & charts
│   ├── Trips.jsx          # Trips management
│   ├── Inventory.jsx      # Inventory tracking
│   ├── AIAnalysis.jsx     # AI insights
│   └── Settings.jsx       # Configuration
├── services/
│   └── api.js             # Axios API client
├── hooks/                 # Custom React hooks (optional)
└── styles/                # Global styles (optional)
```

## 🔐 Styling Approach

- **Material-UI (MUI)**: All components use MUI theming
- **sx Prop**: Inline styling with theme integration
- **Responsive**: Built-in responsive design with breakpoints
- **No CSS Files**: All styling via theme and sx prop

## 🚢 Deployment

### Docker Deployment (Optional)

A Dockerfile is available in the project. To build:

```bash
docker build -t supply-chain-ui .
docker run -p 80:80 supply-chain-ui
```

### Static Hosting

The `dist/` folder contains production-ready files that can be:
- Served via Nginx/Apache
- Deployed to Vercel/Netlify
- Hosted on S3/CloudFront
- Containerized with Docker

## 🐛 Troubleshooting

### Port Already in Use
```bash
# Kill the process on port 5173
lsof -ti:5173 | xargs kill -9
```

### API Connection Issues
- Check `VITE_API_URL` in `.env`
- Ensure API Gateway is running on correct port
- Check CORS headers in API Gateway

### Map Not Loading
- Verify internet connection (uses OpenStreetMap tiles)
- Check browser console for errors
- Ensure Leaflet CSS is imported

### Build Warnings
- The chunk size warning can be resolved with code splitting (recommended for production)
- Current build is production-ready despite the warning

## 📚 Useful Commands

```bash
# Development
npm run dev              # Start dev server

# Production
npm run build            # Build for production
npm run preview          # Preview production build

# Linting (optional)
npm run lint             # ESLint (if configured)

# Package Management
npm install              # Install dependencies
npm update               # Update dependencies
```

## 🔄 Hot Module Replacement (HMR)

Vite provides instant HMR during development. Any changes to components will reflect immediately without page reload.

## 🎓 Next Steps

1. **Connect Real API**: Replace mock data with actual API calls
2. **Add Authentication**: Implement user login/logout
3. **WebSocket Integration**: Real-time data updates
4. **Performance Optimization**: Code splitting, lazy loading
5. **Testing**: Add Jest and React Testing Library
6. **Dark Mode**: Implement theme toggle
7. **PWA**: Convert to Progressive Web App

## 📖 Additional Resources

- [Vite Documentation](https://vitejs.dev)
- [Material-UI Documentation](https://mui.com)
- [React Documentation](https://react.dev)
- [Recharts Documentation](https://recharts.org)
- [React Leaflet Documentation](https://react-leaflet.js.org)
- [React Router Documentation](https://reactrouter.com)

## 📝 Notes

- All data is currently mocked for demonstration
- API integration points are clearly marked in code
- Responsive design has been tested on common breakpoints
- Build is optimized and ready for production
- Theme colors can be easily customized in `App.jsx`

---

**Last Updated**: January 2026
**Version**: 1.0.0
**Status**: ✅ Production Ready

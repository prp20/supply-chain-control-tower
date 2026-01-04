# Complete Services Architecture: Redis Streams & API Endpoints

## Table of Contents
1. [Core Input Streams](#core-input-streams)
2. [Core Output Streams](#core-output-streams)
3. [HTTP API Endpoints](#http-api-endpoints)
4. [WebSocket Endpoints](#websocket-endpoints)
5. [Service-to-Service Communication](#service-to-service-communication)

---

## Core Input Streams

### 1. trip.route.requested
**Produced by**: `data_ingestion_service` <br>
**Consumed by**: `route_planner_service`, `persist_database_service`

**Purpose**: Request initial route planning for trips starting up. Triggered when trips are found in the database with empty routes.

**Payload**:
```json
{
  "trip_id": 1,
  "start_lat": 34.0522,
  "start_long": -118.2437,
  "dest_lat": 42.3314,
  "dest_long": -83.0458
}
```

**Frequency**: Startup only (when service starts, routes all unplanned trips)

---

### 2. vehicle.events.<vehicle_id>
**Produced by**: `data_ingestion_service` (GPS stream generator)  <br>
**Consumed by**: `route_planner_service`, `API gateway`, `persist_database_service`

**Purpose**: Live GPS telemetry from vehicles following their planned routes. Published for each waypoint along the OSRM route.

**Payload**:
```json
{
  "trip_id": 1,
  "vehicle_id": 1,
  "lat": 36.12,
  "long": -115.17,
  "speed_kmph": 60,
  "timestamp": "2026-01-04T18:45:12Z"
}
```

**Frequency**: 1 event per second per vehicle (along route coordinates)

**Additional Notes**: 
- Stream name uses vehicle_id as suffix: `vehicle.events.1`, `vehicle.events.2`, etc.
- Continuous until trip completion
- Used for real-time vehicle tracking and route re-optimization

---

### 3. traffic.events
**Produced by**: `data_ingestion_service` (traffic feed generator) <br>
**Consumed by**: `route_planner_service`, `API gateway`, `persist_database_service`

**Purpose**: Real-time traffic and congestion updates that may impact route ETAs.

**Payload**:
```json
{
  "region": "Midwest-USA",
  "severity": "MEDIUM",
  "cause": "CONGESTION",
  "expected_delay_minutes": 25
}
```

**Frequency**: Every 15 seconds

**Additional Notes**: 
- Used for dynamic ETA adjustments
- Influences delay probability calculation in route_planner
- No vehicle/trip association (regional scope)

---

### 4. news.events
**Produced by**: `data_ingestion_service` (news feed generator) <br>
**Consumed by**: `route_planner_service`, `API gateway`, `persist_database_service`

**Purpose**: Logistics-relevant news and alerts (weather, incidents) that may impact routes.

**Payload**:
```json
{
  "category": "WEATHER",
  "location": "Great Lakes Region",
  "impact": "LOGISTICS_DELAY",
  "confidence": 0.7
}
```

**Frequency**: Every 20 seconds

**Additional Notes**: 
- Event-driven (weather alerts, emergency closures, etc.)
- Regional scope, no direct vehicle/trip mapping
- Used for risk factor calculation

---

### 5. inventory.events
**Produced by**: `data_ingestion_service` (inventory consumption generator) <br>
**Consumed by**: `inventory_service`, `persist_database_service`

**Purpose**: Delta stock changes from assembly line consumption and usage.

**Payload**:
```json
{
  "part_id": 1,
  "delta": -3,
  "reason": "ASSEMBLY_LINE_USAGE"
}
```

**Frequency**: Every 5 seconds per random part

**Additional Notes**: 
- Delta can be positive (replenishment arrival) or negative (consumption)
- Triggers inventory analysis and health scoring in inventory_service
- Persisted to database for audit trail

---

### 6. supplier.events
**Produced by**: `data_ingestion_service` (supplier capacity generator) <br>
**Consumed by**: `inventory_service`, `persist_database_service`

**Purpose**: Real-time supplier capacity and availability updates.

**Payload**:
```json
{
  "supplier_id": 1,
  "available_capacity": 450
}
```

**Frequency**: Every 10 seconds per supplier

**Additional Notes**: 
- Used for replenishment risk assessment
- Low capacity increases supplier risk score
- Influences reorder recommendations

---

### 7. trip.started
**Produced by**: `data_ingestion_service` (on route.plan.created event) <br>
**Consumed by**: `persist_database_service`, `API gateway`

**Purpose**: Marks the beginning of a trip after route is confirmed.

**Payload**:
```json
{
  "trip_id": 1,
  "trip_status": "STARTED"
}
```

**Frequency**: Once per trip (after route planning completes)

**Additional Notes**: 
- Triggers GPS stream generation for that vehicle
- Updates trip status in database
- Broadcast to WebSocket clients for UI updates

---

### 8. trip.completed
**Produced by**: `data_ingestion_service` (after GPS waypoints exhausted) <br>
**Consumed by**: `inventory_service`, `persist_database_service`, `API gateway`

**Purpose**: Signals successful trip completion and delivery arrival.

**Payload**:
```json
{
  "trip_id": 1,
  "trip_status": "COMPLETED"
}
```

**Frequency**: Once per trip (at destination)

**Additional Notes**: 
- Finalizes trip record in database
- Triggers replenishment quantity addition to inventory (if applicable)
- Broadcast to WebSocket for live map updates

---

## Core Output Streams

### 1. route.plan.created
**Produced by**: `route_planner_service` <br>
**Consumed by**: `data_ingestion_service`, `persist_database_service`, `API gateway`

**Purpose**: Persist the initial planned route ONCE. Primary output of route planning for new trips.

**Payload**:
```json
{
  "trip_id": 1,
  "route": {
    "geometry": {
      "coordinates": [
        [-118.2437, 34.0522],
        [-118.0, 34.1],
        [-117.9, 34.15],
        ...
      ]
    },
    "distance_km": 3850.50,
    "duration_minutes": 2100.25,
    "base_eta_minutes": 2100.25,
    "adjusted_eta_minutes": 2250.0
  },
  "confidence": 0.92
}
```

**Frequency**: Once per trip (on startup, when routes are requested)

**Additional Notes**: 
- Persisted to `trips.route` column in database
- Used by UI for initial route rendering on map
- Triggers `trip.started` event after persistence
- Includes OSRM geometry for Leaflet rendering
- Confidence = 1 - delay_probability

---

### 2. route.status.updated
**Produced by**: `route_planner_service` <br>
**Consumed by**: `API gateway`, `persist_database_service`

**Purpose**: Operational route updates (NO database write). Used for live ETA adjustments based on vehicle position, traffic, and news.

**Payload**:
```json
{
  "trip_id": 1,
  "route": {
    "distance_km": 3850.50,
    "base_eta_minutes": 2100.25,
    "adjusted_eta_minutes": 2250.0,
    "geometry": { "coordinates": [...] }
  },
  "confidence": 0.87,
  "eta_adjustment_reason": "vehicle.events"
}
```

**Frequency**: Every vehicle position update, traffic event, or news alert (1-15 second intervals)

**Additional Notes**: 
- NOT persisted to database (transient)
- Used for live UI updates via WebSocket
- Triggers live alerts if confidence drops below threshold
- Multiple adjustment reasons: `vehicle.events`, `traffic.events`, `news.events`

---

### 3. trip.delay.predicted
**Produced by**: `route_planner_service` <br>
**Consumed by**: `API gateway`, `persist_database_service`

**Purpose**: Risk alerting for predicted delays and operational risks.

**Payload**:
```json
{
  "trip_id": 1,
  "delay_probability": 0.35,
  "main_risk_factors": [
    "TRAFFIC_CONGESTION",
    "WEATHER_IMPACT"
  ]
}
```

**Frequency**: On significant risk changes (traffic events, news, vehicle position updates)

**Additional Notes**: 
- Persisted for historical analysis and audit
- Triggers high-priority alerts if probability > 0.5
- Used for AI analysis and predictive maintenance
- Risk factors derived from traffic + news + current vehicle state

---

### 4. inventory.low_stock
**Produced by**: `inventory_service` <br>
**Consumed by**: `API gateway`, `persist_database_service`

**Purpose**: Alert when inventory falls below minimum required threshold.

**Payload**:
```json
{
  "part_id": 1,
  "current_stock": 15,
  "minimum_required": 40,
  "criticality": "CRITICAL"
}
```

**Frequency**: On each consumption event if threshold is crossed

**Additional Notes**: 
- Broadcast via WebSocket for real-time dashboard alerts
- Triggers replenishment workflow
- Critical parts trigger higher-priority alerts
- Used for inventory health visualization

---

### 5. inventory.health.updated
**Produced by**: `inventory_service` <br>
**Consumed by**: `API gateway`, `persist_database_service`

**Purpose**: Comprehensive inventory health scoring and risk classification.

**Payload**:
```json
{
  "part_id": 1,
  "health_score": 35.5,
  "risk_level": "HIGH"
}
```

**Frequency**: After every inventory event (consumption, replenishment, supplier update)

**Additional Notes**: 
- Health score ranges 0-100 (0 = critical, 100 = healthy)
- Risk levels: OK, LOW, MEDIUM, HIGH, CRITICAL
- Broadcast to UI for inventory grid color coding
- Used for trend analysis in charts

---

### 6. inventory.analysis.persist
**Produced by**: `inventory_service` <br>
**Consumed by**: `persist_database_service`, `API gateway`

**Purpose**: Comprehensive inventory analysis snapshot for persistence, analytics, and AI consumption.

**Payload**:
```json
{
  "part_id": 1,
  "health_score": 35.5,
  "risk_level": "HIGH",
  "stock_gap": 22,
  "supplier_risk": true,
  "recommendation": "REPLENISH"
}
```

**Frequency**: After every inventory event requiring analysis

**Additional Notes**: 
- Persisted to `inventory_analysis` table with timestamp
- Used for trend charts and historical drill-down
- AI analysis service consumes for predictive maintenance
- Stock gap = minimum_required - current_stock
- Supplier risk = supplier capacity < 50 units/day

---

### 7. inventory.replenishment.recommended
**Produced by**: `inventory_service` <br>
**Consumed by**: `API gateway`, `persist_database_service`

**Purpose**: Autonomous replenishment trigger when stock predictions indicate shortfall.

**Payload**:
```json
{
  "part_id": 1,
  "recommended_qty": 80,
  "reason": "LOW_STOCK_PREDICTED"
}
```

**Frequency**: When needs_replenishment() returns true after analysis

**Additional Notes**: 
- Recommended quantity = minimum_required × 2
- Triggers automatic `trip.route.requested` for replenishment shipment
- Can be overridden by human operators
- Broadcast to dashboard for manual confirmation if critical

---

### 8. inventory.db.update
**Produced by**: `inventory_service` <br>
**Consumed by**: `persist_database_service`

**Purpose**: Periodic absolute stock synchronization to database (not just deltas).

**Payload**:
```json
{
  "part_id": 1,
  "current_stock": 45,
  "last_updated": "2026-01-04T10:15:00Z"
}
```

**Frequency**: Every 3 minutes (FLUSH_INTERVAL_SECONDS = 180)

**Additional Notes**: 
- Ensures database reflects in-memory state
- Guard against data loss during service restarts
- All parts in inventory_state are flushed, not just changed ones
- Timestamp ensures dedup across service replicas

---

## HTTP API Endpoints

### Health & Status

#### GET `/health`
**Service**: `api_gateway` <br>
**Purpose**: Liveness check for service orchestration and load balancers

**Response**:
```json
{
  "status": "ok"
}
```

**HTTP Status**: 200

---

### Vehicles & Routing

#### GET `/vehicles`
**Service**: `api_gateway` <br>
**Purpose**: Live vehicle list with route data for map rendering

**Response**:
```json
[
  {
    "trip_id": 1,
    "vehicle_id": 1,
    "vehicle_make": "Volvo FH"
  }
]
```

**HTTP Status**: 200

**Additional Notes**: 
- Returns only vehicles with active trips (route IS NOT NULL)
- Used by Live Map component to render vehicle markers
- Trip data joined from `trips` and `vehicles` tables
- Updated via WebSocket for real-time positions

---

### Trips

#### GET `/trips`
**Service**: `api_gateway` <br>
**Purpose**: Trips navigation page (table view). Shows all trips with current status.

**Response**:
```json
[
  {
    "trip_id": 1,
    "status": "STARTED",
    "part_name": "Battery Pack",
    "quantity": 20,
    "cost": 15000,
    "source": "Los Angeles, CA",
    "destination": "Detroit, MI"
  }
]
```

**HTTP Status**: 200

**Additional Notes**: 
- Joins trips, parts, and vehicles tables
- Status values: YET_TO_START, STARTED, COMPLETED
- Location labels derived from coordinates (simple geolocation)
- Sorted by trip ID
- Used for trips list page navigation

---

#### GET `/trip/{trip_id}`
**Service**: `api_gateway` <br>
**Purpose**: Drill-down into individual trip details for detailed view.

**Response**:
```json
{
  "trip_id": 1,
  "vehicle_id": 1,
  "vehicle_make": "Volvo FH",
  "route": {
    "geometry": {
      "coordinates": [
        [-118.2437, 34.0522],
        [-117.9, 34.1],
        ...
      ]
    },
    "distance_km": 3850.50,
    "duration_minutes": 2100.25
  },
  "start_lat": 34.0522,
  "start_long": -118.2437,
  "dest_lat": 42.3314,
  "dest_long": -83.0458
}
```

**HTTP Status**: 200 or 404 (if trip not found)

**Additional Notes**: 
- Used for trip detail modal/panel
- Route is OSRM geometry from `route.plan.created` event
- Returns route only if planned (route IS NOT NULL)
- Contains all coordinates for Leaflet polyline rendering

---

### Inventory

#### GET `/inventory`
**Service**: `api_gateway` <br>
**Purpose**: Basic inventory visibility showing all parts and current stock levels.

**Response**:
```json
[
  {
    "part": "Battery Pack",
    "current_stock": 60,
    "minimum_required": 40,
    "criticality": "CRITICAL"
  },
  {
    "part": "Engine Oil",
    "current_stock": 125,
    "minimum_required": 50,
    "criticality": "HIGH"
  }
]
```

**HTTP Status**: 200

**Additional Notes**: 
- Basic view, no health scores or risk levels
- Joined from `inventory` and `parts` tables
- Used for inventory list view
- Real-time via WebSocket for live updates

---

#### GET `/inventory/summary`
**Service**: `api_gateway` <br>
**Purpose**: KPI dashboard showing overall inventory health and risks.

**Response**:
```json
{
  "total_parts": 10,
  "parts_below_minimum": 3,
  "critical_parts_at_risk": 2,
  "active_replenishments": 1
}
```

**HTTP Status**: 200

**Computation Logic**:
- `total_parts`: COUNT(*) from inventory table
- `parts_below_minimum`: COUNT(*) where current_stock < minimum_required
- `critical_parts_at_risk`: COUNT(*) where risk_level = 'HIGH' AND criticality = 'CRITICAL' (from latest inventory_analysis)
- `active_replenishments`: COUNT(*) where trip_status IN ('YET_TO_START', 'STARTED') AND part_id IS NOT NULL

**Additional Notes**: 
- Used for inventory dashboard KPIs and health indicators
- Broadcast via WebSocket for real-time updates
- Critical indicator for operational status
- Drives alert UI highlighting

---

#### GET `/inventory/health`
**Service**: `api_gateway` <br>
**Purpose**: **Most important endpoint**. Drives the inventory grid/heatmap with comprehensive health data.

**Response**:
```json
[
  {
    "part_id": 1,
    "part_name": "Battery Pack",
    "criticality": "CRITICAL",
    "current_stock": 18,
    "minimum_required": 40,
    "health_score": 35,
    "risk_level": "HIGH"
  },
  {
    "part_id": 2,
    "part_name": "Engine Oil",
    "criticality": "HIGH",
    "current_stock": 125,
    "minimum_required": 50,
    "health_score": 88,
    "risk_level": "OK"
  }
]
```

**HTTP Status**: 200

**Additional Notes**: 
- Joins `inventory`, `parts`, and `inventory_analysis` tables
- Gets LATEST analysis per part (ordered by analyzed_at DESC)
- DISTINCT ON (part_id) for most recent record
- Color coding based on risk_level: OK (green) → LOW (yellow) → MEDIUM (orange) → HIGH (red) → CRITICAL (dark red)
- Health score 0-100 scale used for gradient visualization
- Used for main inventory dashboard and click-through drill-down

---

#### GET `/inventory/part/{part_id}`
**Service**: `api_gateway` <br>
**Purpose**: Single part drill-down for detailed analysis and recommendations.

**Response**:
```json
{
  "part_id": 1,
  "part_name": "Battery Pack",
  "criticality": "CRITICAL",
  "current_stock": 18,
  "minimum_required": 40,
  "health_score": 35,
  "risk_level": "HIGH",
  "recommendation": "REPLENISH",
  "last_updated": "2026-01-04T10:15:00Z"
}
```

**HTTP Status**: 200 or empty (if part not found)

**Additional Notes**: 
- Drives right-side drill-down panel/modal
- Shows latest analysis for single part
- Recommendation: OK, REPLENISH, URGENT_REPLENISH
- Last_updated timestamp for trend context
- Used for detailed part inspection and manual actions

---

#### GET `/inventory/analysis/{part_id}`
**Service**: `api_gateway` <br>
**Purpose**: Historical inventory analysis for trend charts and predictive insights.

**Response**:
```json
[
  {
    "health_score": 95,
    "risk_level": "OK",
    "analyzed_at": "2026-01-04T09:00:00Z"
  },
  {
    "health_score": 88,
    "risk_level": "OK",
    "analyzed_at": "2026-01-04T09:05:00Z"
  },
  {
    "health_score": 75,
    "risk_level": "LOW",
    "analyzed_at": "2026-01-04T09:10:00Z"
  }
]
```

**HTTP Status**: 200

**Query Details**:
- Ordered by analyzed_at ASC (oldest first) for trend line
- Returns all records for part_id from inventory_analysis table
- Sorted chronologically for charting

**Additional Notes**: 
- Used for trend charts on dashboard
- Helps judge credibility of current health score
- Post-mortem analysis for incident investigation
- Shows health degradation over time
- Used for predictive ETA on when part will hit critical

---

## WebSocket Endpoints

### WS `/ws/live`
**Service**: `api_gateway` <br>
**Purpose**: Real-time bidirectional streaming (NO polling). Eliminates latency for critical operational updates.

**Message Format (Server → Client)**:
```json
{
  "stream": "vehicle.events.1",
  "payload": {
    "trip_id": 1,
    "vehicle_id": 1,
    "lat": 36.12,
    "long": -115.17,
    "speed_kmph": 60,
    "timestamp": "2026-01-04T18:45:12Z"
  }
}
```

**Subscription Message (Client → Server)**:
```json
{
  "action": "subscribe",
  "stream": "vehicle.events.*"
}
```

**Unsubscription Message (Client → Server)**:
```json
{
  "action": "unsubscribe",
  "stream": "vehicle.events.1"
}
```

**Broadcast Streams**:
- `vehicle.events.*` - Live vehicle GPS updates (one per second per vehicle)
- `route.status.updated` - ETA and route adjustments (on traffic/news/position changes)
- `trip.delay.predicted` - Risk alerts (on delay probability > threshold)
- `inventory.health.updated` - Inventory health changes (on consumption/replenishment)
- `inventory.low_stock` - Low stock warnings (on threshold breach)
- `inventory.replenishment.recommended` - Auto-replenishment triggers (on prediction)
- `trip.started` - Trip lifecycle events
- `trip.completed` - Trip completion notifications

**Connection Lifecycle**:
1. Client connects to `/ws/live`
2. Client sends subscribe messages for desired streams
3. Server filters broadcasts based on subscriptions
4. Client receives only subscribed stream data
5. Connection closes on disconnect (404, network error, etc.)

**Additional Notes**: 
- Supports wildcard subscriptions: `vehicle.events.*` matches all vehicles
- Backpressure: Server sends at Redis stream rate (no buffering delays)
- Used for live vehicle movement on map
- Used for delay alerts and risk visualization
- Used for inventory KPI updates
- Eliminates HTTP polling overhead
- Graceful reconnection via browser WebSocket API

---

## Service-to-Service Communication

### Data Flow Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      DATA INGESTION                          │
├─────────────────────────────────────────────────────────────┤
│ Produces:                                                    │
│ • trip.route.requested ──→ Route Planner                   │
│ • vehicle.events.* ──────→ Route Planner, API Gateway      │
│ • traffic.events ────────→ Route Planner, API Gateway      │
│ • news.events ───────────→ Route Planner, API Gateway      │
│ • inventory.events ──────→ Inventory Service               │
│ • supplier.events ───────→ Inventory Service               │
│ • trip.started ──────────→ Persist DB, API Gateway         │
│ • trip.completed ────────→ Inventory Service, Persist DB   │
└─────────────────────────────────────────────────────────────┘
                                ↓
┌─────────────────────────────────────────────────────────────┐
│                      ROUTE PLANNER                           │
├─────────────────────────────────────────────────────────────┤
│ Consumes:                                                    │
│ • trip.route.requested                                      │
│ • vehicle.events.*                                          │
│ • traffic.events                                            │
│ • news.events                                               │
│                                                              │
│ Produces:                                                    │
│ • route.plan.created ─────→ Persist DB, Data Ingestion     │
│ • route.status.updated ───→ API Gateway, Persist DB        │
│ • trip.delay.predicted ───→ API Gateway, Persist DB        │
└─────────────────────────────────────────────────────────────┘
                                ↓
┌─────────────────────────────────────────────────────────────┐
│                    INVENTORY SERVICE                         │
├─────────────────────────────────────────────────────────────┤
│ Consumes:                                                    │
│ • inventory.events                                          │
│ • supplier.events                                           │
│ • trip.completed                                            │
│                                                              │
│ Produces:                                                    │
│ • inventory.low_stock ────────────→ API Gateway, Persist DB│
│ • inventory.health.updated ───────→ API Gateway, Persist DB│
│ • inventory.replenishment.recommended → API Gateway        │
│ • inventory.analysis.persist ─────→ Persist DB             │
│ • inventory.db.update ────────────→ Persist DB             │
│ • trip.route.requested ───────────→ Route Planner (auto)   │
└─────────────────────────────────────────────────────────────┘
                                ↓
┌─────────────────────────────────────────────────────────────┐
│                    PERSIST DATABASE                          │
├─────────────────────────────────────────────────────────────┤
│ Consumes (from all services):                               │
│ • inventory.events                                          │
│ • inventory.analysis.persist                                │
│ • inventory.db.update                                       │
│ • vehicle.events.*                                          │
│ • supplier.events                                           │
│ • route.plan.created                                        │
│ • route.status.updated                                      │
│ • trip.started                                              │
│ • trip.completed                                            │
│ • trip.delay.predicted                                      │
│                                                              │
│ Writes to Tables:                                           │
│ • inventory (stock deltas)                                  │
│ • inventory_analysis (health scores + risk)                 │
│ • trips (status, routes, delays)                            │
│ • vehicles (GPS position)                                   │
│ • suppliers (capacity)                                      │
└─────────────────────────────────────────────────────────────┘
                                ↓
┌─────────────────────────────────────────────────────────────┐
│                      API GATEWAY                             │
├─────────────────────────────────────────────────────────────┤
│ Consumes (for WebSocket broadcasting):                      │
│ • vehicle.events.*                                          │
│ • route.status.updated                                      │
│ • trip.delay.predicted                                      │
│ • inventory.health.updated                                  │
│ • inventory.low_stock                                       │
│ • inventory.replenishment.recommended                       │
│ • trip.started                                              │
│ • trip.completed                                            │
│                                                              │
│ Serves (HTTP):                                              │
│ • /health                                                   │
│ • /vehicles                                                 │
│ • /trips                                                    │
│ • /trip/{trip_id}                                           │
│ • /inventory                                                │
│ • /inventory/summary                                        │
│ • /inventory/health                                         │
│ • /inventory/part/{part_id}                                 │
│ • /inventory/analysis/{part_id}                             │
│                                                              │
│ Serves (WebSocket):                                         │
│ • /ws/live                                                  │
└─────────────────────────────────────────────────────────────┘
                                ↓
┌─────────────────────────────────────────────────────────────┐
│                      UI DASHBOARD                            │
├─────────────────────────────────────────────────────────────┤
│ Consumes (HTTP polling):                                    │
│ • GET /vehicles → Live Map                                  │
│ • GET /trips → Trips List                                   │
│ • GET /trip/{trip_id} → Trip Detail                         │
│ • GET /inventory/summary → KPI Dashboard                    │
│ • GET /inventory/health → Inventory Grid/Heatmap            │
│ • GET /inventory/part/{part_id} → Drill-down Panel          │
│ • GET /inventory/analysis/{part_id} → Trend Charts          │
│                                                              │
│ Consumes (WebSocket subscription):                          │
│ • vehicle.events.* → Real-time vehicle tracking             │
│ • route.status.updated → Live ETA updates                   │
│ • trip.delay.predicted → Risk alerts                        │
│ • inventory.health.updated → Health score changes           │
│ • inventory.low_stock → Stock alerts                        │
└─────────────────────────────────────────────────────────────┘
```

### Event Processing Order (Trip Lifecycle)

```
1. Trip Created (in database) [Seed]
   ↓
2. data_ingestion sends: trip.route.requested
   ↓
3. route_planner receives → calculates OSRM route
   ↓
4. route_planner sends: route.plan.created
   ↓
5. data_ingestion receives → marks trip as ready
   ↓
6. data_ingestion sends: trip.started
   ↓
7. persist_database updates: trips.trip_status = STARTED
   ↓
8. data_ingestion streams: vehicle.events.* (one per second per waypoint)
   ↓
9. route_planner receives → adjusts ETA
   ↓
10. route_planner sends: route.status.updated
    ↓
11. api_gateway broadcasts: WebSocket /ws/live
    ↓
12. UI updates: Live Map with new vehicle position
    ↓
13. [After all waypoints processed]
    ↓
14. data_ingestion sends: trip.completed
    ↓
15. persist_database updates: trips.trip_status = COMPLETED
    ↓
16. inventory_service receives → adds replenishment qty to inventory
```

### Event Deduplication

**Persist Database Service** maintains dedup table:
```sql
CREATE TABLE processed_events (
  event_id TEXT PRIMARY KEY,
  processed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

- Every Redis event has unique `event_id` (UUID)
- Each handler checks `is_event_processed(cursor, event_id)` before acting
- Handles service restarts and replay scenarios gracefully
- Prevents double-writes to database

---

## Summary Table

| Stream | Producer | Consumer(s) | Frequency | DB Persist |
|--------|----------|-------------|-----------|------------|
| trip.route.requested | data_ingestion | route_planner, persist_db | startup | ✓ (trips.route) |
| vehicle.events.* | data_ingestion | route_planner, api_gateway, persist_db | 1/sec | ✓ |
| traffic.events | data_ingestion | route_planner, api_gateway, persist_db | 15s | ✓ |
| news.events | data_ingestion | route_planner, api_gateway, persist_db | 20s | ✓ |
| inventory.events | data_ingestion | inventory_service, persist_db | 5s | ✓ |
| supplier.events | data_ingestion | inventory_service, persist_db | 10s | ✓ |
| trip.started | data_ingestion | persist_db, api_gateway | 1/trip | ✓ |
| trip.completed | data_ingestion | inventory_service, persist_db, api_gateway | 1/trip | ✓ |
| route.plan.created | route_planner | data_ingestion, persist_db, api_gateway | 1/trip | ✓ |
| route.status.updated | route_planner | api_gateway, persist_db | variable | ✗ |
| trip.delay.predicted | route_planner | api_gateway, persist_db | variable | ✓ |
| inventory.low_stock | inventory_service | api_gateway, persist_db | event-driven | ✓ |
| inventory.health.updated | inventory_service | api_gateway, persist_db | event-driven | ✓ |
| inventory.analysis.persist | inventory_service | persist_db, api_gateway | event-driven | ✓ |
| inventory.replenishment.recommended | inventory_service | api_gateway, persist_db | event-driven | ✓ |
| inventory.db.update | inventory_service | persist_db | 3min | ✓ |

---

## Key Architectural Patterns

1. **Event-Driven Architecture**: All inter-service communication via Redis Streams
2. **Publish-Subscribe**: Loosely coupled services with selective message filtering
3. **Request-Reply via Events**: route.plan.created follows trip.route.requested
4. **Periodic Sync**: inventory.db.update ensures database consistency every 3 minutes
5. **WebSocket Real-Time**: API Gateway broadcasts to UI clients via /ws/live
6. **Deduplication**: UUID-based idempotency for replay safety
7. **Health Scoring**: Inventory Service enriches raw data with ML-driven health scores
8. **Autonomous Triggering**: inventory.replenishment.recommended triggers trip.route.requested automatically
9. **Delta vs. Absolute**: Inventory tracks deltas (consumption) + periodic absolute syncs


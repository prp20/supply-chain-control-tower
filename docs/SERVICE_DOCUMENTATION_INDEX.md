# Services Documentation Index

Complete documentation for all microservices in the Supply Chain POC platform.

## 📚 Documentation Files

### 1. [API Gateway Service](api_gateway_service.md)
**Purpose**: Central HTTP & WebSocket endpoint for the supply chain platform

**Key Functions**:
- `websocket_endpoint()` - Handle WebSocket connections for real-time updates
- `startup_event()` - Initialize async background tasks
- `get_db_connection()` - PostgreSQL connection management
- `discover_streams()` - Discover Redis streams
- `redis_stream_listener()` - Main listener task
- HTTP API endpoints: `/health`, `/vehicles`, `/trips`, `/trip/{id}`, `/inventory*`

**Provides**:
- 5 HTTP API endpoint groups (health, vehicles, trips, inventory)
- 1 WebSocket endpoint (`/ws/live`)
- Real-time stream broadcasting to clients

---

### 2. [Data Ingestion Service](data_ingestion_service.md)
**Purpose**: Generate synthetic data streams and manage trip lifecycle

**Key Functions**:
- `handle_route_created()` - Listen for route completion and initiate GPS streams
- `main()` - Initialize generators and start service
- `publish_event()` - Publish events to Redis streams
- `stream_vehicle_gps()` - Stream GPS coordinates (1/sec)
- `stream_inventory_events()` - Generate consumption events (5sec)
- `stream_supplier_capacity()` - Generate capacity updates (10sec)
- `stream_traffic()` - Generate traffic updates (15sec)
- `stream_news()` - Generate news alerts (20sec)

**Produces**:
- 8 Redis streams (trip.*, vehicle.*, inventory.*, supplier.*, traffic.*, news.*)

**Threading Model**: Main thread + 5 daemon threads

---

### 3. [Inventory Service](inventory_service.md)
**Purpose**: Real-time inventory management, health scoring, and alert generation

**Key Functions**:
- `bootstrap_inventory()` - Load initial inventory state
- `consume()` - Main event loop for intelligence pipeline
- `publish_event()` - Publish events
- `load_initial_inventory()` - Populate memory state
- `update_part()` - Merge state updates
- `get_part()` - Retrieve part state
- `is_low_stock()` - Stock level check
- `compute_health_score()` - Health calculation (0-100)
- `classify_risk()` - Risk level classification
- `needs_replenishment()` - Replenishment logic
- 5 alert publishers (low_stock, health, replenishment, db_update, analysis)

**Consumes**:
- inventory.events (5sec)
- supplier.events (10sec)
- trip.completed (1/trip)

**Produces**:
- inventory.low_stock
- inventory.health.updated
- inventory.analysis.persist
- inventory.replenishment.recommended
- inventory.db.update (3min)

---

### 4. [Persist Database Service](persist_database_service.md)
**Purpose**: Consume all events and persistently store in PostgreSQL

**Key Functions**:
- `main()` - Initialize DB and start consumer
- `get_db_connection()` - PostgreSQL connection
- `run_sql_file()` - Execute SQL scripts
- `consume_events()` - Main event loop with deduplication
- `is_event_processed()` - Check dedup table
- `mark_event_processed()` - Record processed event
- 7 event handlers (inventory, vehicle, supplier, trip, route)

**Consumes**: 10+ Redis streams with event deduplication

**Persists To**: 5 database tables (inventory, inventory_analysis, trips, vehicles, suppliers)

**Key Pattern**: UUID-based idempotency via processed_events table

---

### 5. [Route Planner Service](route_planner_service.md)
**Purpose**: Optimize vehicle routes in real-time using OSRM

**Key Functions**:
- `handle_event()` - Process incoming events and generate routes
- `main()` - Service initialization
- `consume_events()` - Event consumer
- `publish()` - Event publisher
- `get_route()` - Query OSRM API
- `adjust_eta()` - ETA adjustment algorithm
- `route_plan_updated_schema()` - Build route update payload
- `trip_delay_predicted_schema()` - Build delay prediction payload

**Consumes**:
- trip.route.requested (1/trip startup)
- vehicle.events (1/sec per vehicle)
- traffic.events (15sec)
- news.events (20sec)

**Produces**:
- route.plan.created (initial)
- route.status.updated (live)
- trip.delay.predicted (risk alerts)

**External Integration**: OSRM routing API

---

## 📊 Architecture Overview

```
Data Ingestion Service (Generators)
    ↓ (produces 8 streams)
Route Planner Service (OSRM optimization)
    ↓
Inventory Service (Intelligence & Alerts)
    ↓
Persist Database Service (Event Sink)
    ↓ (queries)
API Gateway Service (HTTP/WebSocket)
    ↓
UI Dashboard (React)
```

---

## 🔄 Event Flow Summary

| Stream | Producer | Consumer(s) | Frequency |
|--------|----------|-------------|-----------|
| trip.route.requested | data_ingestion | route_planner | startup |
| vehicle.events.* | data_ingestion | route_planner, api_gateway | 1/sec |
| traffic.events | data_ingestion | route_planner, api_gateway | 15sec |
| news.events | data_ingestion | route_planner, api_gateway | 20sec |
| inventory.events | data_ingestion | inventory_service | 5sec |
| supplier.events | data_ingestion | inventory_service | 10sec |
| trip.started | data_ingestion | persist_db, api_gateway | 1/trip |
| trip.completed | data_ingestion | inventory_service, persist_db | 1/trip |
| route.plan.created | route_planner | data_ingestion, persist_db | 1/trip |
| route.status.updated | route_planner | api_gateway, persist_db | variable |
| trip.delay.predicted | route_planner | api_gateway, persist_db | variable |
| inventory.low_stock | inventory_service | api_gateway, persist_db | event-driven |
| inventory.health.updated | inventory_service | api_gateway, persist_db | event-driven |
| inventory.replenishment.recommended | inventory_service | api_gateway | event-driven |
| inventory.analysis.persist | inventory_service | persist_db | event-driven |
| inventory.db.update | inventory_service | persist_db | 3min |

---

## 🔑 Key Design Patterns

1. **Event-Driven Architecture** - All inter-service communication via Redis Streams
2. **Publish-Subscribe** - Loosely coupled, selective message filtering
3. **Request-Reply via Events** - route.plan.created follows trip.route.requested
4. **Event Sourcing** - All changes captured as immutable events
5. **Deduplication** - UUID-based idempotency for replay safety
6. **In-Memory Cache** - Inventory service maintains state for fast analysis
7. **Periodic Sync** - Database consistency maintained via timed flushes
8. **Autonomous Triggering** - Replenishment orders created automatically

---

## 📡 API Endpoints (API Gateway)

### Health
- `GET /health` → `{status: "ok"}`

### Vehicles
- `GET /vehicles` → Vehicle list with routes

### Trips
- `GET /trips` → Trip list with status
- `GET /trip/{trip_id}` → Trip detail with full route

### Inventory
- `GET /inventory` → All parts with stock
- `GET /inventory/summary` → KPI metrics
- `GET /inventory/health` → Health scores (main endpoint)
- `GET /inventory/part/{part_id}` → Single part detail
- `GET /inventory/analysis/{part_id}` → Historical trend data

### WebSocket
- `WS /ws/live` → Real-time stream subscription

---

## 🗄️ Database Tables

**inventory**
- part_id, current_stock, minimum_required, criticality, last_updated

**inventory_analysis**
- part_id, health_score, risk_level, stock_gap, supplier_risk, recommendation, analyzed_at

**trips**
- id, trip_status, route (JSONB), vehicle_id, part_id, start/dest coords

**vehicles**
- id, vehicle_make, lat, long

**suppliers**
- id, max_daily_capacity

**processed_events** (dedup)
- event_id (PK), processed_at

---

## 🚀 Startup Order

1. **PostgreSQL** - Data persistence
2. **Redis** - Event streaming
3. **Persist Database Service** - Init schema & seed
4. **Route Planner Service** - Ready for route requests
5. **Inventory Service** - Load initial state
6. **Data Ingestion Service** - Start generators
7. **API Gateway** - Expose HTTP/WebSocket

---

## 📋 Environment Variables (docker-compose)

All services use:
```bash
POSTGRES_HOST=postgres
POSTGRES_PORT=5432
POSTGRES_DB=controltower_db
POSTGRES_USER=controltower
POSTGRES_PASSWORD=controltower
REDIS_HOST=redis
REDIS_PORT=6379
```

---

## 🔗 Cross-References

- **Complete Channels Doc**: [services_channels.md](services_channels.md)
- **Original Route Channels**: [route_channels.md](route_channels.md)

---

## 📝 Function Count

- **API Gateway**: 19 functions
- **Data Ingestion**: 11 functions
- **Inventory Service**: 17 functions
- **Persist Database**: 12 functions
- **Route Planner**: 9 functions
- **Total**: 68 functions documented

---

## 🎯 Quick Navigation

### By Service
- [API Gateway](api_gateway_service.md)
- [Data Ingestion](data_ingestion_service.md)
- [Inventory Service](inventory_service.md)
- [Persist Database](persist_database_service.md)
- [Route Planner](route_planner_service.md)

### By Topic
- [All Streams & Channels](services_channels.md)
- [HTTP Endpoints](api_gateway_service.md#http-api-endpoints)
- [WebSocket Protocol](api_gateway_service.md#websocket-endpoints)
- [Database Schema](persist_database_service.md#database-schema-expectations)
- [Threading Model](data_ingestion_service.md#threading-model)


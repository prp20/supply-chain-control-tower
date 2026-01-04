# Data Ingestion Service Documentation

**Purpose**: Generate synthetic data streams for development/testing and manage trip lifecycle. Produces vehicle GPS telemetry, inventory events, supplier data, traffic/news feeds. Listens for route planning completion and initiates trip execution.

**Key Files**:
- `main.py` - Service initialization and event handling
- `redis_producer.py` - Event publishing to Redis
- `schemas.py` - Event payload schemas
- `db_reader.py` - Database operations
- `generators/vehicle_gps.py` - GPS telemetry generator
- `generators/inventory_events.py` - Stock consumption generator
- `generators/supplier_capacity.py` - Supplier capacity generator
- `generators/traffic_feed.py` - Traffic update generator
- `generators/news_feed.py` - News alert generator

---

## Core Functions

### main.py

#### `handle_route_created() -> None`
**Purpose**: Listen for route planning completion and initiate trip GPS streams

**Input**: None

**Output**: None (runs indefinitely)

**Side Effects**: 
- Reads from `route.plan.created` Redis stream
- Fetches vehicle_id from database for each trip
- Publishes `trip.started` event
- Spawns `stream_vehicle_gps` thread for each trip
- Adds trip_id to `started_trips` set to prevent duplicates

**Flow**:
1. Connect to Redis with `$` (read new messages)
2. For each route creation event:
   - Extract trip_id and route geometry
   - Skip if already started (dedup)
   - Query DB for vehicle_id
   - Publish trip.started event
   - Spawn GPS stream thread
3. Repeat indefinitely

**Prevents**: Duplicate trip starts via `started_trips` set

---

#### `main() -> None`
**Purpose**: Initialize data ingestion service and start all generators

**Input**: None

**Output**: None (runs indefinitely)

**Side Effects**: 
- Queries database for trips, parts, suppliers
- Publishes trip.route.requested for all trips with empty routes
- Spawns background threads for:
  - stream_inventory_events
  - stream_supplier_capacity
  - stream_traffic
  - stream_news
  - handle_route_created

**Flow**:
1. Query trips with empty routes (JSON `{}`)
2. Publish trip.route.requested for each
3. Load parts and suppliers from DB
4. Start background generators:
   - Inventory consumption (5s interval)
   - Supplier capacity (10s interval)
   - Traffic updates (15s interval)
   - News alerts (20s interval)
5. Start route listener (handles trip starts)

**Execution Model**: Main thread blocks on route listener, other threads run as daemons

---

### redis_producer.py

#### `publish_event(stream: str, event_type: str, payload: dict) -> None`
**Purpose**: Publish event to Redis stream with metadata

**Input**:
- `stream: str` - Redis stream name (e.g., "vehicle.events.1")
- `event_type: str` - Event type label (e.g., "VEHICLE_GPS_UPDATE")
- `payload: dict` - Event data

**Output**: None

**Side Effects**: 
- Creates event envelope with metadata
- Adds to Redis stream
- Generates UUID for idempotency

**Event Envelope**:
```json
{
  "event_id": "uuid4",
  "event_type": "VEHICLE_GPS_UPDATE",
  "source": "data-ingestion-service",
  "timestamp": "2026-01-04T18:45:12Z",
  "payload": "{...json stringified payload...}"
}
```

---

### schemas.py

#### `vehicle_gps_schema(vehicle_id: int, trip_id: int, lat: float, long: float, speed: int) -> dict`
**Purpose**: Build vehicle GPS event payload

**Input**:
- `vehicle_id: int` - Vehicle ID
- `trip_id: int` - Trip ID
- `lat: float` - Latitude
- `long: float` - Longitude
- `speed: int` - Speed in kmph

**Output**: 
```json
{
  "vehicle_id": 1,
  "trip_id": 1,
  "lat": 36.12,
  "long": -115.17,
  "speed": 60
}
```

**Note**: Schema does not include timestamp (added by publish_event)

---

#### `inventory_event_schema(part_id: int, delta: int, reason: str) -> dict`
**Purpose**: Build inventory consumption event payload

**Input**:
- `part_id: int` - Part ID
- `delta: int` - Stock delta (negative for consumption, positive for replenishment)
- `reason: str` - Reason for change (e.g., "ASSEMBLY_LINE_USAGE")

**Output**: 
```json
{
  "part_id": 1,
  "delta": -3,
  "reason": "ASSEMBLY_LINE_USAGE"
}
```

---

### db_reader.py

#### `get_db_connection() -> psycopg2.connection`
**Purpose**: Establish PostgreSQL connection from environment variables

**Input**: None (reads environment)
- `POSTGRES_HOST`
- `POSTGRES_PORT`
- `POSTGRES_DB`
- `POSTGRES_USER`
- `POSTGRES_PASSWORD`

**Output**: 
- `psycopg2.connection` - Open database connection

---

#### `execute_query(conn: psycopg2.connection, query: str) -> List[tuple]`
**Purpose**: Execute database query and return all results

**Input**:
- `conn: psycopg2.connection` - Database connection
- `query: str` - SQL query to execute

**Output**: 
- `List[tuple]` - All rows returned by query

**Side Effects**: 
- Creates cursor
- Executes query

---

### generators/vehicle_gps.py

#### `stream_vehicle_gps(trip_id: int, vehicle_id: int, route: dict) -> None`
**Purpose**: Stream GPS coordinates along planned route, one per second

**Input**:
- `trip_id: int` - Trip ID
- `vehicle_id: int` - Vehicle ID
- `route: dict` - Route object with geometry coordinates

**Output**: None (publishes events indefinitely until route complete)

**Side Effects**: 
- Publishes vehicle.events.<vehicle_id> for each coordinate
- Sleeps 1 second between coordinates
- Publishes trip.completed when route exhausted

**Flow**:
1. Extract coordinates from route.geometry.coordinates
2. Create stream name: f"vehicle.events.{vehicle_id}"
3. For each coordinate (lon, lat):
   - Publish GPS event with vehicle_id, trip_id, lat, long, speed_kmph=60
   - Sleep 1 second
4. After all waypoints:
   - Publish trip.completed event
5. Exit thread

**Stream Name**: `vehicle.events.1`, `vehicle.events.2`, etc. (per vehicle)

**Frequency**: 1 event per second (one per route waypoint)

**Note**: Handles missing/invalid routes gracefully (prints error, returns)

---

### generators/inventory_events.py

#### `stream_inventory_events(parts: List[dict]) -> None`
**Purpose**: Generate random inventory consumption events

**Input**:
- `parts: List[dict]` - List of parts with part_id key

**Output**: None (runs indefinitely)

**Side Effects**: 
- Publishes inventory.events stream continuously
- Runs as daemon thread

**Flow**:
1. Infinite loop:
   - Randomly select a part
   - Generate delta: -1 to -5 (consumption)
   - Publish inventory event
   - Sleep 5 seconds

**Stream**: `inventory.events`

**Frequency**: Every 5 seconds

**Payload**:
```json
{
  "part_id": 3,
  "delta": -2,
  "reason": "ASSEMBLY_LINE_USAGE"
}
```

---

### generators/supplier_capacity.py

#### `stream_supplier_capacity(suppliers: List[dict]) -> None`
**Purpose**: Generate random supplier capacity updates

**Input**:
- `suppliers: List[dict]` - List of suppliers with supplier_id key

**Output**: None (runs indefinitely)

**Side Effects**: 
- Publishes supplier.events stream continuously
- Runs as daemon thread

**Flow**:
1. Infinite loop:
   - Randomly select a supplier
   - Generate capacity: 200-600 units
   - Publish supplier event
   - Sleep 10 seconds

**Stream**: `supplier.events`

**Frequency**: Every 10 seconds

**Payload**:
```json
{
  "supplier_id": 1,
  "available_capacity": 450
}
```

---

### generators/traffic_feed.py

#### `stream_traffic() -> None`
**Purpose**: Generate synthetic traffic/congestion updates

**Input**: None

**Output**: None (runs indefinitely)

**Side Effects**: 
- Publishes traffic.events stream continuously
- Runs as daemon thread

**Flow**:
1. Infinite loop:
   - Publish fixed traffic event
   - Sleep 15 seconds

**Stream**: `traffic.events`

**Frequency**: Every 15 seconds

**Payload**:
```json
{
  "region": "Midwest-USA",
  "severity": "MEDIUM",
  "cause": "CONGESTION",
  "expected_delay_minutes": 25
}
```

**Note**: Fixed payload for demo purposes (could be randomized)

---

### generators/news_feed.py

#### `stream_news() -> None`
**Purpose**: Generate synthetic news and alert events

**Input**: None

**Output**: None (runs indefinitely)

**Side Effects**: 
- Publishes news.events stream continuously
- Runs as daemon thread

**Flow**:
1. Infinite loop:
   - Publish fixed news event
   - Sleep 20 seconds

**Stream**: `news.events`

**Frequency**: Every 20 seconds

**Payload**:
```json
{
  "category": "WEATHER",
  "location": "Great Lakes Region",
  "impact": "LOGISTICS_DELAY",
  "confidence": 0.7
}
```

**Note**: Fixed payload for demo purposes (could be randomized)

---

## Event Publishing Sequence

### Startup
```
1. Query trips with empty routes
   ↓
2. Publish trip.route.requested for each unplanned trip
   ↓
3. Query parts and suppliers
   ↓
4. Start background generators (inventory, supplier, traffic, news)
   ↓
5. Start route listener (blocks main thread)
```

### Route Completion (Async)
```
1. Route listener detects route.plan.created event
   ↓
2. Query vehicle_id for trip
   ↓
3. Publish trip.started
   ↓
4. Spawn stream_vehicle_gps thread
   ↓
5. GPS thread streams waypoints every 1 second
   ↓
6. GPS thread publishes trip.completed at destination
```

---

## Threading Model

| Thread | Function | Start | Stop |
|--------|----------|-------|------|
| Main | handle_route_created | startup | never (blocks) |
| Daemon | stream_inventory_events | startup | service stop |
| Daemon | stream_supplier_capacity | startup | service stop |
| Daemon | stream_traffic | startup | service stop |
| Daemon | stream_news | startup | service stop |
| Daemon | stream_vehicle_gps | per trip | after trip complete |

**Key**: All generator threads are daemon threads (don't block shutdown)

---

## Stream Publishing Summary

| Stream | Generator | Frequency | Payload |
|--------|-----------|-----------|---------|
| trip.route.requested | main() | startup | trip_id, start/dest coords |
| trip.started | handle_route_created | per trip | trip_id, trip_status |
| trip.completed | stream_vehicle_gps | per trip | trip_id, trip_status |
| vehicle.events.* | stream_vehicle_gps | 1/sec | trip_id, vehicle_id, lat, long, speed |
| inventory.events | stream_inventory_events | 5sec | part_id, delta, reason |
| supplier.events | stream_supplier_capacity | 10sec | supplier_id, available_capacity |
| traffic.events | stream_traffic | 15sec | region, severity, cause, delay_minutes |
| news.events | stream_news | 20sec | category, location, impact, confidence |

---

## Environment Variables

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

## Dependencies

- **psycopg2**: PostgreSQL driver
- **redis**: Redis client
- **threading**: Multi-threading
- **random**: Randomized data generation
- **time**: Sleep/delays

---

## Idempotency

- `started_trips` set prevents duplicate trip initiations
- UUID in event_id allows downstream deduplication
- Route listener uses `$` to read new messages (no replay)

---

## Error Handling

- **Missing Route**: stream_vehicle_gps prints error and returns silently
- **Missing Vehicle**: handle_route_created assumes vehicle exists (queries DB)
- **Missing Part/Supplier**: Skipped in generators (random.choice won't pick)


# API Gateway Service Documentation

**Purpose**: Central HTTP & WebSocket endpoint for the supply chain platform. Serves REST APIs for vehicle tracking, trip management, and inventory monitoring. Provides real-time updates via WebSocket.

**Key Files**:
- `main.py` - FastAPI app setup with routes and WebSocket
- `db.py` - PostgreSQL connection management
- `redis_client.py` - Redis connection singleton
- `redis_listener.py` - Stream listener for broadcasting
- `websocket_manager.py` - WebSocket connection management
- `routes/health.py`, `routes/vehicles.py`, `routes/trips.py`, `routes/inventory.py` - API endpoints

---

## Core Functions

### main.py

#### `websocket_endpoint(websocket: WebSocket)`
**Purpose**: Handle WebSocket connections for real-time live updates

**Input**: 
- `websocket: WebSocket` - Client WebSocket connection

**Output**: 
- `None` - Runs indefinitely until disconnect

**Side Effects**: 
- Registers/disconnects clients in ConnectionManager
- Handles subscription/unsubscription messages
- Broadcasts stream events to connected clients

**Flow**:
1. Accept WebSocket connection
2. Loop: receive client messages (subscription requests)
3. Handle subscription/unsubscription
4. On disconnect: clean up connection

---

#### `startup_event()`
**Purpose**: Initialize async background tasks on service startup

**Input**: None

**Output**: None

**Side Effects**: 
- Creates async task for Redis stream listener
- Starts background listener that runs throughout service lifetime

**Flow**:
1. Called by FastAPI on startup
2. Creates task: `redis_stream_listener(manager)`
3. Task runs continuously

---

### db.py

#### `get_db_connection() -> psycopg2.connection`
**Purpose**: Establish and return PostgreSQL database connection

**Input**: None (reads from environment variables)
- `POSTGRES_HOST`
- `POSTGRES_PORT`
- `POSTGRES_DB`
- `POSTGRES_USER`
- `POSTGRES_PASSWORD`

**Output**: 
- `psycopg2.connection` - Open database connection

**Side Effects**: 
- Creates new connection from environment config
- Connection must be closed by caller

---

### redis_client.py

#### Module-level initialization
**Purpose**: Create Redis client singleton

**Input**: None (reads from environment variables)
- `REDIS_HOST`
- `REDIS_PORT`

**Output**: 
- `redis.Redis` - Global redis_client instance

**Side Effects**: 
- Creates global connection used throughout service
- Decode responses to string format

---

### redis_listener.py

#### `discover_streams() -> Set[str]`
**Purpose**: Discover all Redis streams matching known prefixes

**Input**: None

**Output**: 
- `Set[str]` - Set of stream names found in Redis

**Side Effects**: 
- Scans Redis keyspace with cursor
- Filters by STREAM_PREFIXES

**Known Prefixes**:
- `vehicle.events.`
- `route.status.updated`
- `trip.delay.predicted`
- `inventory.health.updated`
- `inventory.low_stock`
- `inventory.replenishment.recommended`

---

#### `stream_matches_filter(stream: str, filter_pattern: str) -> bool`
**Purpose**: Check if stream name matches client subscription filter pattern

**Input**:
- `stream: str` - Redis stream name
- `filter_pattern: str` - Client subscription pattern (supports wildcards with `*`)

**Output**: 
- `bool` - True if stream matches pattern

**Logic**:
- Exact match: `stream == filter_pattern`
- Wildcard match: `filter_pattern.endswith("*")` → prefix match

---

#### `async redis_stream_listener(manager: ConnectionManager) -> None`
**Purpose**: Main async task that listens to Redis streams and broadcasts to WebSocket clients

**Input**:
- `manager: ConnectionManager` - WebSocket connection manager

**Output**: None (runs indefinitely)

**Side Effects**: 
- Reads from all discovered streams
- Broadcasts events to subscribed clients
- Updates stream offsets to avoid replaying

**Flow**:
1. Discover all active streams
2. Initialize offsets to "0" for new streams
3. Read from all streams with 1-second block
4. For each message: broadcast to filtered clients
5. Update stream offset
6. Sleep 50ms and repeat

---

### websocket_manager.py

#### `ConnectionManager.__init__()`
**Purpose**: Initialize WebSocket connection manager

**Input**: None

**Output**: None

**Side Effects**: 
- Creates empty `connections: List[WebSocket]` dict
- Creates empty `client_subscriptions: Dict` for tracking per-client subscriptions

---

#### `async connect(websocket: WebSocket) -> None`
**Purpose**: Register new WebSocket client connection

**Input**:
- `websocket: WebSocket` - Client connection

**Output**: None

**Side Effects**: 
- Accepts the WebSocket connection
- Adds to active connections list
- Initializes subscription dict for client

---

#### `disconnect(websocket: WebSocket) -> None`
**Purpose**: Remove WebSocket client from active connections

**Input**:
- `websocket: WebSocket` - Client connection to remove

**Output**: None

**Side Effects**: 
- Removes from connections list
- Cleans up subscription dict entry

---

#### `async handle_client_message(websocket: WebSocket, message: str) -> None`
**Purpose**: Process subscription/unsubscription messages from client

**Input**:
- `websocket: WebSocket` - Client connection
- `message: str` - JSON message with action and stream

**Output**: None

**Side Effects**: 
- Parses JSON message
- Adds stream to subscriptions (subscribe action)
- Removes stream from subscriptions (unsubscribe action)

**Message Format**:
```json
{
  "action": "subscribe",
  "stream": "vehicle.events.*"
}
```

---

#### `stream_matches_subscription(stream: str, subscription: str) -> bool`
**Purpose**: Check if stream matches client's subscription filter

**Input**:
- `stream: str` - Redis stream name
- `subscription: str` - Client subscription pattern

**Output**: 
- `bool` - True if stream matches subscription

---

#### `async broadcast_to_all(message: dict) -> None`
**Purpose**: Send message to all connected WebSocket clients

**Input**:
- `message: dict` - Message to broadcast (converted to JSON)

**Output**: None

**Side Effects**: 
- Sends JSON message to all active connections
- Silently skips disconnected clients

---

#### `async broadcast_filtered(message: dict, stream: str) -> None`
**Purpose**: Send message only to clients subscribed to the stream

**Input**:
- `message: dict` - Message to broadcast
- `stream: str` - Redis stream name

**Output**: None

**Side Effects**: 
- Filters clients by subscription match
- Sends JSON only to matching clients

---

### routes/health.py

#### `health() -> dict`
**Purpose**: Liveness check endpoint for load balancers and orchestration

**Input**: None

**Output**: 
```json
{
  "status": "ok"
}
```

**HTTP Method**: GET `/health`

**Status Code**: 200

---

### routes/vehicles.py

#### `get_vehicles() -> List[dict]`
**Purpose**: Fetch active vehicles with trip associations for live map rendering

**Input**: None

**Output**: 
```json
[
  {
    "trip_id": 1,
    "vehicle_id": 1,
    "vehicle_make": "Volvo FH"
  }
]
```

**HTTP Method**: GET `/vehicles`

**SQL Query**: Joins trips and vehicles tables where route IS NOT NULL

**Side Effects**: 
- Opens and closes DB connection

---

### routes/trips.py

#### `get_trips() -> List[dict]`
**Purpose**: Fetch all trips with status and part information for trips list page

**Input**: None

**Output**: 
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

**HTTP Method**: GET `/trips`

**Side Effects**: 
- Opens and closes DB connection
- Derives location labels from coordinates

---

#### `location_label(lat: float, lon: float) -> str`
**Purpose**: Determine city label from geographic coordinates using simple rules

**Input**:
- `lat: float` - Latitude
- `lon: float` - Longitude

**Output**: 
- `str` - Location name (e.g., "Detroit, MI", "Los Angeles, CA")

**Logic**: Deterministic rules based on coordinate ranges

---

#### `get_trip_detail(trip_id: int) -> dict`
**Purpose**: Fetch detailed information for a specific trip including route geometry

**Input**:
- `trip_id: int` - Trip ID

**Output**: 
```json
{
  "trip_id": 1,
  "vehicle_id": 1,
  "vehicle_make": "Volvo FH",
  "route": {
    "geometry": {
      "coordinates": [[-118.2437, 34.0522], ...]
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

**HTTP Method**: GET `/trip/{trip_id}`

**Status Codes**: 200 or 404 if not found

**Side Effects**: 
- Queries DB
- Returns 404 HTTPException if trip not found

---

### routes/inventory.py

#### `get_inventory() -> List[dict]`
**Purpose**: Basic inventory listing showing current stock levels

**Input**: None

**Output**: 
```json
[
  {
    "part": "Battery Pack",
    "current_stock": 60,
    "minimum_required": 40,
    "criticality": "CRITICAL"
  }
]
```

**HTTP Method**: GET `/inventory`

---

#### `inventory_summary() -> dict`
**Purpose**: Get inventory health KPIs for dashboard

**Input**: None

**Output**: 
```json
{
  "total_parts": 10,
  "parts_below_minimum": 3,
  "critical_parts_at_risk": 2,
  "active_replenishments": 1
}
```

**HTTP Method**: GET `/inventory/summary`

**Computation**:
- `total_parts`: COUNT(*) from inventory
- `parts_below_minimum`: COUNT(*) where current_stock < minimum_required
- `critical_parts_at_risk`: COUNT(*) where risk_level='HIGH' AND criticality='CRITICAL'
- `active_replenishments`: COUNT(*) where trip_status IN ('YET_TO_START', 'STARTED')

---

#### `inventory_health() -> List[dict]`
**Purpose**: Main endpoint for inventory grid/heatmap showing health scores

**Input**: None

**Output**: 
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
  }
]
```

**HTTP Method**: GET `/inventory/health`

**SQL Logic**: 
- DISTINCT ON (part_id) - gets latest analysis per part
- Joins inventory, parts, inventory_analysis
- Ordered by analyzed_at DESC

---

#### `inventory_part(part_id: int) -> dict`
**Purpose**: Single part drill-down with latest analysis and recommendations

**Input**:
- `part_id: int` - Part ID

**Output**: 
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

**HTTP Method**: GET `/inventory/part/{part_id}`

---

#### `inventory_analysis_history(part_id: int) -> List[dict]`
**Purpose**: Historical analysis data for trend charts

**Input**:
- `part_id: int` - Part ID

**Output**: 
```json
[
  {
    "health_score": 95,
    "risk_level": "OK",
    "analyzed_at": "2026-01-04T09:00:00Z"
  }
]
```

**HTTP Method**: GET `/inventory/analysis/{part_id}`

**Query**: Sorted by analyzed_at ASC for charting

---

## WebSocket Protocol

### Client → Server: Subscribe to Stream
```json
{
  "action": "subscribe",
  "stream": "vehicle.events.*"
}
```

### Server → Client: Stream Event Broadcast
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

- **FastAPI**: HTTP framework
- **psycopg2**: PostgreSQL driver
- **redis**: Redis client
- **asyncio**: Async runtime

---

## Startup Flow

1. FastAPI initialization
2. Load routers: health, vehicles, trips, inventory
3. Startup event fires:
   - Create ConnectionManager
   - Start redis_stream_listener async task
4. Redis listener begins discovering streams and broadcasting


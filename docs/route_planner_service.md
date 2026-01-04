# Route Planner Service Documentation

**Purpose**: Optimize and dynamically adjust vehicle routes in real-time. Consumes route requests, GPS updates, and environmental factors (traffic, news). Produces initial route plans and live ETA adjustments. Uses OSRM for routing calculations.

**Key Files**:
- `main.py` - Event handling and route optimization logic
- `redis_consumer.py` - Event consumption from streams
- `redis_producer.py` - Event publishing
- `osrm_client.py` - OSRM routing API client
- `route_engine.py` - ETA adjustment algorithm
- `schemas.py` - Event payload schemas
- `state.py` - Global event state management

---

## Core Functions

### main.py

#### `handle_event(stream: str, payload: dict) -> None`
**Purpose**: Process incoming events and generate appropriate route outputs

**Input**:
- `stream: str` - Source stream name
- `payload: dict` - Event payload

**Output**: None

**Side Effects**: 
- Updates global traffic_events and news_events state
- Queries OSRM for routes
- Publishes route outputs

**Event Processing By Type**:

**traffic.events**:
1. Append to `traffic_events` deque
2. No immediate output

**news.events**:
1. Append to `news_events` deque
2. No immediate output

**vehicle.events**:
1. Query OSRM for route from current position to destination
   - From: (payload["lat"], payload["long"])
   - To: (DETROIT_LAT, DETROIT_LON)
2. Calculate adjusted ETA
3. Publish two events:
   - `route.plan.updated` - updated route geometry
   - `trip.delay.predicted` - delay probability and risks

**trip.route.requested**:
1. Query OSRM for initial route
   - From: (payload["start_lat"], payload["start_long"])
   - To: (payload["dest_lat"], payload["dest_long"])
2. Calculate adjusted ETA and delay probability
3. Publish `route.plan.created` event (with confidence score)

---

#### `main() -> None`
**Purpose**: Initialize route planner service and start event consumer

**Input**: None

**Output**: None (runs indefinitely)

**Side Effects**: 
- Print startup message
- Calls consume_events(handle_event)
- Blocks main thread

---

### redis_consumer.py

#### `consume_events(callback: Callable[[str, dict], None]) -> None`
**Purpose**: Main event loop that reads from all route-related streams

**Input**:
- `callback: Callable[[str, dict], None]` - Handler function for each event

**Output**: None (runs indefinitely)

**Streams Consumed**:
```python
STREAM_KEYS = [
    "vehicle.events",
    "traffic.events",
    "news.events",
    "trip.route.requested"
]
```

**Flow**:
1. Initialize stream offsets to "0" (from beginning)
2. Infinite loop:
   - xread all streams (no block, busy loop)
   - For each message:
     - Extract payload JSON
     - Call callback(stream, payload)
     - Update stream offset
     - Handle exceptions gracefully
3. Repeat

**Error Handling**: Print error and continue (no crash on bad events)

---

### redis_producer.py

#### `publish(stream: str, event_type: str, payload: dict) -> None`
**Purpose**: Publish event to Redis stream

**Input**:
- `stream: str` - Stream name (e.g., "route.plan.created")
- `event_type: str` - Event type label
- `payload: dict` - Event data

**Output**: None

**Side Effects**: 
- Creates event envelope with UUID and timestamp
- Adds to Redis stream

**Event Envelope**:
```json
{
  "event_id": "uuid4",
  "event_type": "ROUTE_PLAN_CREATED",
  "timestamp": "2026-01-04T18:45:12Z",
  "payload": "{...json stringified...}"
}
```

**Note**: No "source" field (unlike data_ingestion)

---

### osrm_client.py

#### `get_route(start_lat: float, start_lon: float, dest_lat: float, dest_lon: float) -> dict`
**Purpose**: Query OSRM API for optimal route between two coordinates

**Input**:
- `start_lat: float` - Starting latitude
- `start_lon: float` - Starting longitude
- `dest_lat: float` - Destination latitude
- `dest_lon: float` - Destination longitude

**Output**: 
```json
{
  "distance_km": 3850.50,
  "duration_minutes": 2100.25,
  "geometry": {
    "coordinates": [
      [-118.2437, 34.0522],
      [-117.9, 34.1],
      ...
    ]
  }
}
```

**Side Effects**: 
- Makes HTTP request to OSRM server
- Parses response

**OSRM Endpoint**: (configured in environment or hardcoded)

**Query Format**:
```
GET /route/v1/driving/{start_lon},{start_lat};{dest_lon},{dest_lat}?geometries=geojson&overview=full
```

**Response Fields**:
- `routes[0].distance` - Distance in meters
- `routes[0].duration` - Duration in seconds
- `routes[0].geometry` - GeoJSON linestring

**Conversion**:
- Distance: meters → kilometers (divide by 1000)
- Duration: seconds → minutes (divide by 60)

---

### route_engine.py

#### `adjust_eta(base_eta_minutes: float) -> Tuple[float, float, List[str]]`
**Purpose**: Adjust ETA based on traffic, news, and historical factors

**Input**:
- `base_eta_minutes: float` - Base ETA from OSRM (in minutes)

**Output**: 
```python
(
  adjusted_eta: float,           # Adjusted ETA in minutes
  delay_probability: float,      # 0.0 to 1.0
  risks: List[str]               # Risk factors (e.g., ["TRAFFIC_CONGESTION", "WEATHER"])
)
```

**Side Effects**: 
- Reads from global `traffic_events` and `news_events`
- No modifications to state

**Algorithm**:
1. Extract recent traffic events
   - Severity weight: HIGH=0.4, MEDIUM=0.2, LOW=0.1
   - Calculate average severity
2. Extract recent news events
   - Confidence: 0.0 to 1.0
   - Impact weight if category matches (WEATHER, etc.)
3. Combine factors:
   - Base ETA × (1 + traffic_impact + news_impact)
   - Delay probability = min(combined_impact, 1.0)
4. Build risk factors list
5. Return (adjusted_eta, delay_probability, risks)

**Example**:
- Base ETA: 2100 minutes
- High traffic (+20%): 2520 minutes
- Weather news (+15%): 2898 minutes
- Delay probability: 0.35

---

### schemas.py

#### `route_plan_updated_schema(...) -> dict`
**Purpose**: Build route.status.updated event payload

**Input**:
- `trip_id: int`
- `distance_km: float`
- `duration_minutes: float`
- `adjusted_eta_minutes: float`
- `geometry: dict`
- `confidence: float`

**Output**: 
```json
{
  "trip_id": 1,
  "route": {
    "distance_km": 3850.50,
    "base_eta_minutes": 2100.25,
    "adjusted_eta_minutes": 2250.0,
    "geometry": {...}
  },
  "confidence": 0.87
}
```

---

#### `trip_delay_predicted_schema(trip_id: int, delay_prob: float, risks: List[str]) -> dict`
**Purpose**: Build trip.delay.predicted event payload

**Input**:
- `trip_id: int`
- `delay_prob: float` - Delay probability (0.0-1.0)
- `risks: List[str]` - Risk factors

**Output**: 
```json
{
  "trip_id": 1,
  "delay_probability": 0.35,
  "main_risk_factors": ["TRAFFIC_CONGESTION", "WEATHER_IMPACT"]
}
```

---

### state.py

#### Module-level Initialization
**Purpose**: Initialize global event queues for traffic and news

**Input**: None

**Output**: 
- `traffic_events: deque` - Max 50 recent traffic events
- `news_events: deque` - Max 50 recent news events

**Data Structure**:
```python
traffic_events = deque(maxlen=50)  # Oldest events auto-evicted
news_events = deque(maxlen=50)
```

**Usage**: 
- Events appended by handle_event()
- Read by adjust_eta()
- Old events automatically removed (FIFO)

---

## Route Optimization Flow

### On trip.route.requested
```
Event: trip.route.requested
   ↓
Query OSRM for route
   ↓
Call adjust_eta() → get adjusted_eta + delay_prob
   ↓
Publish route.plan.created
   ↓
Data Ingestion receives → triggers trip.started
```

### On vehicle.events (GPS update)
```
Event: vehicle.events.1
   ↓
Query OSRM for route from current position to destination
   ↓
Call adjust_eta() → get adjusted_eta + delay_prob
   ↓
Publish route.plan.updated (live)
   ↓
Publish trip.delay.predicted
   ↓
API Gateway broadcasts via WebSocket
```

### On traffic.events / news.events
```
Event: traffic.events
   ↓
Append to global traffic_events deque
   ↓
Next vehicle.events will pick up new factor in adjust_eta()
   ↓
ETA automatically re-calculated
```

---

## Output Streams

### route.plan.created (Initial Route)
**Produced For**: trip.route.requested events
**Frequency**: Once per trip
**Consumers**: data_ingestion, persist_database, api_gateway

**Payload Example**:
```json
{
  "trip_id": 1,
  "route": {
    "geometry": {
      "coordinates": [
        [-118.2437, 34.0522],
        ...
      ]
    },
    "distance_km": 3850.50,
    "duration_minutes": 2100.25,
    "adjusted_eta_minutes": 2250.0
  },
  "confidence": 0.92
}
```

---

### route.status.updated (Live Updates)
**Produced For**: vehicle.events, traffic.events, news.events
**Frequency**: 1-15 second intervals (on position/event changes)
**Consumers**: api_gateway, persist_database (via redis_listener)

**Payload Example**:
```json
{
  "trip_id": 1,
  "route": {
    "distance_km": 3850.50,
    "base_eta_minutes": 2100.25,
    "adjusted_eta_minutes": 2250.0,
    "geometry": {...}
  },
  "confidence": 0.87,
  "eta_adjustment_reason": "vehicle.events"
}
```

**Note**: NOT persisted to database (transient updates)

---

### trip.delay.predicted (Risk Alert)
**Produced For**: vehicle.events (if confidence drops or risks appear)
**Frequency**: On significant risk changes
**Consumers**: api_gateway, persist_database

**Payload Example**:
```json
{
  "trip_id": 1,
  "delay_probability": 0.35,
  "main_risk_factors": ["TRAFFIC_CONGESTION", "WEATHER_IMPACT"]
}
```

**Alert Trigger**: If delay_probability > 0.5

---

## ETA Adjustment Examples

### Scenario 1: Clear Roads, Good Weather
```
Base ETA: 2100 minutes
Traffic impact: 0 (no events)
News impact: 0 (no events)
Adjusted ETA: 2100 minutes
Delay probability: 0.0
Risks: []
```

### Scenario 2: Heavy Traffic
```
Base ETA: 2100 minutes
Traffic events: HIGH (0.4)
News impact: 0
Adjusted ETA: 2100 × 1.4 = 2940 minutes
Delay probability: 0.4
Risks: ["TRAFFIC_CONGESTION"]
```

### Scenario 3: Traffic + Weather
```
Base ETA: 2100 minutes
Traffic: MEDIUM (0.2)
News: Weather impact (0.3)
Combined: 1.5
Adjusted ETA: 2100 × 1.5 = 3150 minutes
Delay probability: 0.5
Risks: ["TRAFFIC_CONGESTION", "WEATHER_IMPACT"]
```

---

## Consumed Streams

| Stream | Trigger | Action |
|--------|---------|--------|
| trip.route.requested | Startup | Initial route planning |
| vehicle.events | Per waypoint | Live route re-optimization |
| traffic.events | Every 15sec | Update state (no direct output) |
| news.events | Every 20sec | Update state (no direct output) |

---

## Published Streams

| Stream | Frequency | Consumer |
|--------|-----------|----------|
| route.plan.created | 1/trip | Data Ingestion, Persist DB, API Gateway |
| route.status.updated | 1-15sec | API Gateway, Persist DB |
| trip.delay.predicted | variable | API Gateway, Persist DB |

---

## Environment Variables

```bash
REDIS_HOST=redis
REDIS_PORT=6379
OSRM_HOST=osrm  # or localhost/IP
OSRM_PORT=5000
```

---

## Dependencies

- **redis**: Redis client
- **requests**: HTTP client for OSRM API
- **json**: Event serialization
- **collections.deque**: Event queue (immutable, bounded)

---

## Key Design Patterns

1. **Event-Driven Optimization**: Recomputes ETA on every significant change
2. **State-Based Adjustment**: Global traffic/news state influences all routes
3. **Confidence Scoring**: Reflects uncertainty in delay predictions
4. **Immutable History**: All route versions tracked for audit
5. **Dynamic Re-routing**: Responds to real-time conditions

---

## OSRM Integration

### Endpoint
```
GET /route/v1/driving/{lon1},{lat1};{lon2},{lat2}
  ?geometries=geojson&overview=full
```

### Response Parsing
```python
response = requests.get(url)
route = response.json()['routes'][0]

distance_km = route['distance'] / 1000
duration_minutes = route['duration'] / 60
coordinates = route['geometry']['coordinates']
```

### Error Handling
- Network timeouts: Retry with exponential backoff
- Invalid coordinates: Return null route, skip event
- No route found: Log and continue

---

## Performance Characteristics

- **OSRM Query**: ~200-500ms per call (network latency)
- **ETA Adjustment**: <10ms (in-memory calculation)
- **Event Processing**: ~1-2 seconds end-to-end (query + adjust + publish)
- **Throughput**: ~30-50 vehicle updates/second (limited by OSRM)

---

## Scalability Considerations

**Current Bottleneck**: OSRM API calls per vehicle
**Optimization**: Route caching for frequently-traveled paths
**Horizontal Scale**: Multiple route_planner instances with load balancing


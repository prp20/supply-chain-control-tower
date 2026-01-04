# Inventory Service Documentation

**Purpose**: Real-time inventory management and analysis. Consumes inventory events, supplier updates, and trip completions. Performs health scoring and risk analysis. Publishes alerts, recommendations, and autonomous replenishment triggers.

**Key Files**:
- `main.py` - Service initialization and bootstrap
- `redis_consumer.py` - Event consumption and intelligence pipeline
- `redis_producer.py` - Event publishing
- `state.py` - In-memory inventory state management
- `schemas.py` - Event data models
- `db_reader.py` - Database operations
- `analyzers/stock_analyzer.py` - Stock level analysis
- `analyzers/risk_analyzer.py` - Health scoring and risk classification
- `analyzers/reorder_analyzer.py` - Replenishment logic
- `publishers/alert_publisher.py` - Alert/recommendation publishing

---

## Core Functions

### main.py

#### `bootstrap_inventory() -> None`
**Purpose**: Load initial inventory snapshot from database into memory

**Input**: None

**Output**: None

**Side Effects**: 
- Queries inventory table
- Populates in-memory inventory_state
- Loads criticality and minimum_required levels

**Flow**:
1. Connect to database
2. SELECT all parts with stock, minimum_required, criticality
3. Call load_initial_inventory(rows)
4. Close connection

**Startup Prerequisite**: Must run before consume() to avoid null state

---

#### `main() -> None`
**Purpose**: Initialize inventory service and start event consumer

**Input**: None

**Output**: None (runs indefinitely)

**Side Effects**: 
- Calls bootstrap_inventory()
- Starts consume() event loop
- Blocks main thread

**Flow**:
1. Print startup message
2. bootstrap_inventory()
3. consume() - blocks forever

---

### redis_consumer.py

#### `consume() -> None`
**Purpose**: Main event loop consuming inventory, supplier, and trip events

**Input**: None

**Output**: None (runs indefinitely)

**Side Effects**: 
- Reads from 3 Redis streams continuously
- Updates in-memory inventory state
- Publishes analysis and alerts
- Periodically syncs to database
- Updates stream offsets

**Streams Consumed**:
- `inventory.events` - Stock consumption/changes
- `supplier.events` - Supplier capacity updates
- `trip.completed` - Replenishment arrivals

**Event Processing**:

**inventory.events**:
1. Extract part_id and delta (positive or negative)
2. Update in-memory stock: `part["current_stock"] += delta`
3. Run analysis pipeline

**supplier.events**:
1. Extract supplier_id and max_daily_capacity
2. Update supplier_capacity in part state
3. Run analysis pipeline

**trip.completed**:
1. Extract part_id and quantity received
2. Add to inventory: `part["current_stock"] += received_qty`
3. Run analysis pipeline

**Analysis Pipeline** (after state update):
1. Check if stock is low → publish_low_stock()
2. Compute health score → publish_health()
3. Publish detailed analysis → publish_inventory_analysis()
4. Check if replenishment needed → publish_replenishment()

**Periodic Sync** (every 3 minutes):
- For each part in inventory_state: publish_inventory_db_update()
- Ensures database reflects in-memory state

**Flow**:
1. Initialize STREAMS dict with "0" offsets
2. Infinite loop:
   - xread from all streams (1-second block)
   - For each message: process based on stream type
   - Run intelligence pipeline
   - Update stream offset
   - Check if flush interval exceeded (180 seconds)
   - If yes: publish_inventory_db_update for all parts

---

### redis_producer.py

#### `publish_event(stream: str, event_type: str, payload: dict) -> None`
**Purpose**: Publish event to Redis stream with metadata

**Input**:
- `stream: str` - Stream name (e.g., "inventory.low_stock")
- `event_type: str` - Event type (e.g., "LOW_STOCK")
- `payload: dict` - Event data

**Output**: None

**Side Effects**: 
- Creates event envelope with UUID and timestamp
- Adds to Redis stream

**Event Envelope**:
```json
{
  "event_id": "uuid4",
  "event_type": "LOW_STOCK",
  "source": "inventory-service",
  "timestamp": "2026-01-04T18:45:12Z",
  "payload": "{...json stringified...}"
}
```

---

### state.py

#### `load_initial_inventory(parts: List[dict]) -> None`
**Purpose**: Populate in-memory inventory state from database snapshot

**Input**:
- `parts: List[dict]` - Parts with keys: part_id, current_stock, minimum_required, criticality

**Output**: None

**Side Effects**: 
- Populates global `inventory_state` dictionary
- Each part gets timestamp initialized to now

**Part State Structure**:
```python
{
  "part_id": 1,
  "current_stock": 60,
  "minimum_required": 40,
  "criticality": "CRITICAL",
  "supplier_capacity": 100,  # default
  "last_updated": "2026-01-04T18:45:12Z"
}
```

---

#### `update_part(part_id: int, part_data: dict) -> None`
**Purpose**: Merge updated data into in-memory part state

**Input**:
- `part_id: int` - Part ID
- `part_data: dict` - Partial part data to merge

**Output**: None

**Side Effects**: 
- Merges part_data into inventory_state[part_id]
- Updates last_updated timestamp

**Merge Behavior**: Only keys in part_data are updated (non-destructive)

---

#### `get_part(part_id: int) -> dict`
**Purpose**: Retrieve part state from memory

**Input**:
- `part_id: int` - Part ID

**Output**: 
- `dict` - Part state or None if not found

**Side Effects**: None

---

### db_reader.py

#### `get_db_connection() -> psycopg2.connection`
**Purpose**: Establish PostgreSQL connection from environment variables

**Input**: None (reads environment)

**Output**: 
- `psycopg2.connection` - Open database connection

---

### schemas.py

#### Pydantic Models (Data Validation)

**InventoryEvent**:
```python
{
  "part_id": int,
  "delta": int,
  "reason": str
}
```

**SupplierEvent**:
```python
{
  "supplier_id": int,
  "available_capacity": int
}
```

**HealthUpdate**:
```python
{
  "part_id": int,
  "health_score": float,
  "risk_level": str
}
```

---

### analyzers/stock_analyzer.py

#### `is_low_stock(part: dict) -> bool`
**Purpose**: Determine if part stock is below minimum required threshold

**Input**:
- `part: dict` - Part state with current_stock and minimum_required

**Output**: 
- `bool` - True if current_stock < minimum_required

**Logic**: Simple threshold comparison

---

### analyzers/risk_analyzer.py

#### `compute_health_score(part: dict) -> float`
**Purpose**: Calculate inventory health score (0-100 scale)

**Input**:
- `part: dict` - Part state with current_stock, minimum_required, supplier_capacity

**Output**: 
- `float` - Health score 0-100 (0=critical, 100=excellent)

**Scoring Logic**:
- Stock ratio = current_stock / minimum_required
- Base score = stock_ratio * 100
- Supplier risk adjustment: -20 if supplier_capacity < 50
- Criticality adjustment: Additional penalty if criticality='CRITICAL'
- Clamp to [0, 100]

**Example**:
- Part with 60 stock, 40 minimum, healthy supplier → score ~95
- Part with 18 stock, 40 minimum, weak supplier → score ~25

---

#### `classify_risk(health_score: float) -> str`
**Purpose**: Classify risk level from health score

**Input**:
- `health_score: float` - Score 0-100

**Output**: 
- `str` - Risk level: "OK" | "LOW" | "MEDIUM" | "HIGH" | "CRITICAL"

**Classification**:
- 80-100: "OK"
- 60-79: "LOW"
- 40-59: "MEDIUM"
- 20-39: "HIGH"
- 0-19: "CRITICAL"

---

### analyzers/reorder_analyzer.py

#### `needs_replenishment(part: dict) -> bool`
**Purpose**: Determine if part requires autonomous replenishment order

**Input**:
- `part: dict` - Part state

**Output**: 
- `bool` - True if replenishment should be triggered

**Logic**:
- Check: current_stock < minimum_required * 0.5
- OR: health_score < 40 (from risk analyzer)
- OR: supplier_risk is high and stock declining

**Triggers Auto-Replenishment**: When true, inventory_service publishes:
1. inventory.replenishment.recommended
2. trip.route.requested (for auto-order)

---

### publishers/alert_publisher.py

#### `publish_low_stock(part_id: int, part: dict) -> None`
**Purpose**: Publish low stock alert when inventory falls below minimum

**Input**:
- `part_id: int` - Part ID
- `part: dict` - Part state

**Output**: None

**Side Effects**: 
- Publishes to `inventory.low_stock` stream
- Broadcast to UI via WebSocket

**Payload**:
```json
{
  "part_id": 1,
  "current_stock": 15,
  "minimum_required": 40,
  "criticality": "CRITICAL"
}
```

**Triggers**: When is_low_stock(part) returns true

---

#### `publish_health(part_id: int, score: float, risk: str) -> None`
**Purpose**: Publish inventory health score update

**Input**:
- `part_id: int` - Part ID
- `score: float` - Health score 0-100
- `risk: str` - Risk level

**Output**: None

**Side Effects**: 
- Publishes to `inventory.health.updated` stream
- Used for dashboard health grid color coding

**Payload**:
```json
{
  "part_id": 1,
  "health_score": 35.5,
  "risk_level": "HIGH"
}
```

**Frequency**: After every inventory event

---

#### `publish_replenishment(part_id: int, part: dict) -> None`
**Purpose**: Publish autonomous replenishment recommendation

**Input**:
- `part_id: int` - Part ID
- `part: dict` - Part state

**Output**: None

**Side Effects**: 
- Publishes to `inventory.replenishment.recommended` stream
- ALSO publishes to `trip.route.requested` stream (auto-order)

**Payload** (replenishment.recommended):
```json
{
  "part_id": 1,
  "recommended_qty": 80,
  "reason": "LOW_STOCK_PREDICTED"
}
```

**Payload** (trip.route.requested for auto-order):
```json
{
  "part_id": 1,
  "quantity": 80,
  "priority": "HIGH"
}
```

**Note**: Triggers TWO events:
1. Alert to dashboard (for visibility)
2. Auto-order to route_planner (autonomous)

---

#### `publish_inventory_db_update(part_id: int, part: dict) -> None`
**Purpose**: Publish absolute inventory state for periodic database sync

**Input**:
- `part_id: int` - Part ID
- `part: dict` - Complete part state

**Output**: None

**Side Effects**: 
- Publishes to `inventory.db.update` stream
- Consumed by persist_database for DB sync

**Payload**:
```json
{
  "part_id": 1,
  "current_stock": 45,
  "last_updated": "2026-01-04T10:15:00Z"
}
```

**Frequency**: Every 3 minutes (FLUSH_INTERVAL_SECONDS = 180)

**Purpose**: Guard against state loss on service restart

---

#### `publish_inventory_analysis(part_id: int, score: float, risk: str, part: dict) -> None`
**Purpose**: Publish comprehensive analysis snapshot for persistence and AI

**Input**:
- `part_id: int` - Part ID
- `score: float` - Health score
- `risk: str` - Risk level
- `part: dict` - Part state

**Output**: None

**Side Effects**: 
- Publishes to `inventory.analysis.persist` stream
- Consumed by persist_database for historical record
- Used for trend charts and post-mortem analysis

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

**Computed Values**:
- `stock_gap`: minimum_required - current_stock
- `supplier_risk`: supplier_capacity < 50
- `recommendation`: "REPLENISH" if needs_replenishment() else "OK"

**Frequency**: After every inventory event (analyzed_at timestamp in DB)

---

## Intelligence Pipeline

### Per Event
```
Event received (inventory/supplier/trip.completed)
   ↓
Update in-memory state
   ↓
Check low stock? → publish_low_stock()
   ↓
Calculate health score → publish_health()
   ↓
Publish detailed analysis → publish_inventory_analysis()
   ↓
Need replenishment? → publish_replenishment() → also publishes trip.route.requested
   ↓
Update stream offset
```

### Periodic (Every 3 minutes)
```
Check if FLUSH_INTERVAL_SECONDS exceeded
   ↓
For each part in inventory_state:
   publish_inventory_db_update()
   ↓
Ensure database reflects in-memory state
```

---

## Event Processing Summary

| Stream | Action | Output Streams |
|--------|--------|----------------|
| inventory.events | Stock delta update | low_stock, health.updated, analysis.persist, replenishment.recommended |
| supplier.events | Capacity update | health.updated, analysis.persist |
| trip.completed | Replenishment arrival | low_stock, health.updated, analysis.persist |
| (periodic) | DB sync | inventory.db.update |

---

## Memory State Example

```python
inventory_state = {
  1: {
    "part_id": 1,
    "current_stock": 60,
    "minimum_required": 40,
    "criticality": "CRITICAL",
    "supplier_capacity": 100,
    "last_updated": "2026-01-04T18:45:12Z"
  },
  2: {
    "part_id": 2,
    "current_stock": 18,
    "minimum_required": 40,
    "criticality": "CRITICAL",
    "supplier_capacity": 30,
    "last_updated": "2026-01-04T18:50:00Z"
  }
}
```

---

## Consumed Streams

| Stream | Processed By | Frequency | Purpose |
|--------|--------------|-----------|---------|
| inventory.events | consume() | 5sec | Stock consumption |
| supplier.events | consume() | 10sec | Supplier risk |
| trip.completed | consume() | 1/trip | Replenishment arrival |

---

## Published Streams

| Stream | Frequency | Consumer |
|--------|-----------|----------|
| inventory.low_stock | event-driven | API Gateway, Persist DB |
| inventory.health.updated | event-driven | API Gateway, Persist DB |
| inventory.analysis.persist | event-driven | Persist DB, UI |
| inventory.replenishment.recommended | event-driven | API Gateway |
| inventory.db.update | 3min | Persist DB |
| trip.route.requested | event-driven | Route Planner |

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
- **collections.deque**: Event queue (for state.py)
- **time**: Timestamp management

---

## Key Design Patterns

1. **In-Memory Cache**: Avoids DB queries for every event (fast analysis)
2. **Periodic Sync**: Flush to DB every 3 minutes (consistency)
3. **Event Enrichment**: Raw events → analyzed insights
4. **Autonomous Actions**: Replenishment triggered automatically
5. **Immutable History**: All analyses persisted for audit trail

---

## Performance Characteristics

- **Event Processing**: O(1) per event (hash lookup + analysis)
- **Memory Usage**: One dict per part (minimal footprint)
- **DB Queries**: Only during bootstrap and periodic flush
- **Latency**: <100ms from event to alert publication


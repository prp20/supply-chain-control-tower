# Persist Database Service Documentation

**Purpose**: Consume events from all services and persistently record them in PostgreSQL. Acts as event sink with deduplication to ensure data consistency and provide historical audit trail.

**Key Files**:
- `main.py` - Service initialization
- `redis_consumer.py` - Event consumption and routing
- `db.py` - Database connection and SQL execution
- `dedup.py` - Event deduplication
- `handlers/inventory_handler.py` - Inventory event persistence
- `handlers/vehicle_handler.py` - Vehicle/GPS event persistence
- `handlers/supplier_handler.py` - Supplier event persistence
- `handlers/trip_handler.py` - Trip event persistence

---

## Core Functions

### main.py

#### `main() -> None`
**Purpose**: Initialize persist database service, set up database schema, and start event consumer

**Input**: None

**Output**: None (runs indefinitely)

**Side Effects**: 
- Creates PostgreSQL connection
- Runs init.sql (schema initialization)
- Runs seed.sql (initial data)
- Creates processed_events dedup table
- Starts consume_events event loop
- Blocks main thread

**Flow**:
1. Print startup message
2. Connect to database
3. Execute init.sql (CREATE TABLE statements)
   - Commit on success
   - Rollback on error
4. Execute seed.sql (INSERT seed data)
   - Commit on success
   - Rollback on error
5. Create processed_events table (if not exists)
   ```sql
   CREATE TABLE processed_events (
     event_id TEXT PRIMARY KEY,
     processed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
   );
   ```
6. Create Redis connection
7. Call consume_events(redis_client, db_conn)
   - Blocks forever

---

### db.py

#### `get_db_connection() -> psycopg2.connection`
**Purpose**: Establish PostgreSQL database connection from environment variables

**Input**: None (reads environment)

**Output**: 
- `psycopg2.connection` - Open database connection

**Environment Variables**:
- `POSTGRES_HOST`
- `POSTGRES_PORT`
- `POSTGRES_DB`
- `POSTGRES_USER`
- `POSTGRES_PASSWORD`

---

#### `run_sql_file(cursor: psycopg2.cursor, filepath: str) -> None`
**Purpose**: Execute SQL commands from file

**Input**:
- `cursor: psycopg2.cursor` - Database cursor
- `filepath: str` - Path to .sql file

**Output**: None

**Side Effects**: 
- Reads file content
- Executes all SQL statements in file
- Does NOT commit (caller responsible)

**SQL File Parsing**: Splits on `;` statements

---

### redis_consumer.py

#### `consume_events(redis_client: redis.Redis, db_conn: psycopg2.connection) -> None`
**Purpose**: Main event loop consuming from all service streams and persisting to database

**Input**:
- `redis_client: redis.Redis` - Redis connection
- `db_conn: psycopg2.connection` - Database connection

**Output**: None (runs indefinitely)

**Side Effects**: 
- Reads from 10+ Redis streams
- Calls appropriate handler for each event type
- Deduplicates by event_id
- Commits to database
- Updates stream offsets

**Streams Consumed**:
```python
STREAM_HANDLERS = {
    "inventory.events": handle_inventory_event,
    "vehicle.events": handle_vehicle_event,
    "supplier.events": handle_supplier_event,
    "trip.started": handle_trip_event,
    "trip.completed": handle_trip_event,
    "route.plan.created": handle_route_plan_created,
    "trip.delay.predicted": handle_trip_event
}
```

**Event Processing Flow**:
1. xread from all streams with 5-second block
2. For each message:
   - Extract event_id and payload
   - Check dedup: is_event_processed(cursor, event_id)?
   - If already processed: skip (idempotent)
   - If new: call handler(cursor, payload)
   - Mark as processed: mark_event_processed(cursor, event_id)
   - Commit to database
3. Update stream offset
4. Repeat indefinitely

**Idempotency**: UUID-based deduplication prevents double-writes on:
- Service restarts
- Message replays
- Concurrent handler runs (if scaled)

---

### dedup.py

#### `is_event_processed(cursor: psycopg2.cursor, event_id: str) -> bool`
**Purpose**: Check if event has already been processed and persisted

**Input**:
- `cursor: psycopg2.cursor` - Database cursor
- `event_id: str` - Unique event identifier (UUID)

**Output**: 
- `bool` - True if event_id exists in processed_events table

**SQL**:
```sql
SELECT 1 FROM processed_events WHERE event_id = %s;
```

**Side Effects**: None

---

#### `mark_event_processed(cursor: psycopg2.cursor, event_id: str) -> None`
**Purpose**: Record that an event has been processed and persisted

**Input**:
- `cursor: psycopg2.cursor` - Database cursor
- `event_id: str` - Unique event identifier (UUID)

**Output**: None

**Side Effects**: 
- Inserts event_id into processed_events table
- Sets processed_at to current timestamp

**SQL**:
```sql
INSERT INTO processed_events (event_id) VALUES (%s);
```

**Note**: Does NOT commit (caller responsible)

---

### handlers/inventory_handler.py

#### `handle_inventory_event(cursor: psycopg2.cursor, payload: dict) -> None`
**Purpose**: Persist inventory stock change to database

**Input**:
- `cursor: psycopg2.cursor` - Database cursor
- `payload: dict` - Event payload with part_id and delta

**Output**: None

**Side Effects**: 
- Updates inventory table
- Sets last_updated timestamp

**SQL**:
```sql
UPDATE inventory
SET current_stock = current_stock + %s,
    last_updated = NOW()
WHERE part_id = %s;
```

**Parameters**: (delta, part_id)

**Stream**: `inventory.events`

---

#### `handle_inventory_analysis(cursor: psycopg2.cursor, payload: dict) -> None`
**Purpose**: Persist inventory analysis results (health score, risk level)

**Input**:
- `cursor: psycopg2.cursor` - Database cursor
- `payload: dict` - Analysis with health_score, risk_level, etc.

**Output**: None

**Side Effects**: 
- Inserts new record into inventory_analysis table

**SQL**:
```sql
INSERT INTO inventory_analysis
(part_id, health_score, risk_level, stock_gap, supplier_risk, recommendation)
VALUES (%s, %s, %s, %s, %s, %s);
```

**Parameters**: (part_id, health_score, risk_level, stock_gap, supplier_risk, recommendation)

**Stream**: `inventory.analysis.persist`

**Note**: Creates new record (not update) for historical tracking

---

### handlers/vehicle_handler.py

#### `handle_vehicle_event(cursor: psycopg2.cursor, payload: dict) -> None`
**Purpose**: Persist vehicle GPS/telemetry events

**Input**:
- `cursor: psycopg2.cursor` - Database cursor
- `payload: dict` - GPS event with vehicle_id, trip_id, lat, long, speed, timestamp

**Output**: None

**Side Effects**: 
- Updates vehicle position in database (if table exists)
- May update trips table with vehicle location info

**Implementation Note**: Handler exists but detailed persistence logic depends on schema

**Stream**: `vehicle.events.*`

---

### handlers/supplier_handler.py

#### `handle_supplier_event(cursor: psycopg2.cursor, payload: dict) -> None`
**Purpose**: Persist supplier capacity updates

**Input**:
- `cursor: psycopg2.cursor` - Database cursor
- `payload: dict` - Supplier event with supplier_id, available_capacity

**Output**: None

**Side Effects**: 
- Updates suppliers table with capacity

**SQL** (likely):
```sql
UPDATE suppliers
SET max_daily_capacity = %s
WHERE id = %s;
```

**Stream**: `supplier.events`

---

### handlers/trip_handler.py

#### `handle_trip_event(cursor: psycopg2.cursor, payload: dict) -> None`
**Purpose**: Update trip status in database

**Input**:
- `cursor: psycopg2.cursor` - Database cursor
- `payload: dict` - Trip event with trip_id and trip_status

**Output**: None

**Side Effects**: 
- Updates trips table

**SQL**:
```sql
UPDATE trips
SET trip_status = %s
WHERE id = %s;
```

**Parameters**: (trip_status, trip_id)

**Trip Statuses**: 
- `YET_TO_START`
- `STARTED`
- `COMPLETED`

**Streams**: 
- `trip.started`
- `trip.completed`
- `trip.delay.predicted`

---

#### `handle_route_plan_updated(cursor: psycopg2.cursor, payload: dict) -> None`
**Purpose**: Update trip route with re-optimized plan (NOT used for initial route)

**Input**:
- `cursor: psycopg2.cursor` - Database cursor
- `payload: dict` - Route update with trip_id and route geometry

**Output**: None

**Side Effects**: 
- Updates trips table route column

**SQL**:
```sql
UPDATE trips
SET route = %s
WHERE id = %s;
```

**Parameters**: (JSON route, trip_id)

**Note**: Handler defined but not called (route status updates don't persist per requirements)

**Stream**: `route.status.updated` (but NOT consumed by persist_database)

---

#### `handle_route_plan_created(cursor: psycopg2.cursor, payload: dict) -> None`
**Purpose**: Persist initial route plan (ONCE per trip)

**Input**:
- `cursor: psycopg2.cursor` - Database cursor
- `payload: dict` - Route creation event with trip_id and route geometry

**Output**: None

**Side Effects**: 
- Updates trips table route column (only if empty)

**SQL**:
```sql
UPDATE trips
SET route = %s
WHERE id = %s
  AND (route IS NULL OR route = '{}'::jsonb);
```

**Parameters**: (JSON route, trip_id)

**Guard Clause**: Only persists if route is NULL or empty `{}` to prevent overwriting

**Stream**: `route.plan.created`

**Important**: This is the ONLY place initial routes are persisted

---

## Event Persistence Flow

### Startup
```
1. Run init.sql
   ↓
2. Run seed.sql
   ↓
3. Create processed_events table
   ↓
4. Start consume_events loop
```

### Per Event
```
Event arrives on Redis stream
   ↓
Extract event_id and payload
   ↓
Check dedup: is_event_processed(event_id)?
   ↓ (if yes)
Skip and continue
   ↓ (if no)
Call appropriate handler(cursor, payload)
   ↓
Mark as processed: mark_event_processed(event_id)
   ↓
Commit to database
   ↓
Update stream offset
```

---

## Stream Handlers Map

| Stream | Handler | Table Updated | Operation |
|--------|---------|---------------|-----------|
| inventory.events | handle_inventory_event | inventory | UPDATE stock delta |
| trip.started | handle_trip_event | trips | UPDATE status=STARTED |
| trip.completed | handle_trip_event | trips | UPDATE status=COMPLETED |
| trip.delay.predicted | handle_trip_event | trips | UPDATE (if status field) |
| route.plan.created | handle_route_plan_created | trips | UPDATE route (once) |
| vehicle.events | handle_vehicle_event | vehicles | UPDATE position |
| supplier.events | handle_supplier_event | suppliers | UPDATE capacity |

---

## Deduplication Table

```sql
CREATE TABLE processed_events (
  event_id TEXT PRIMARY KEY,
  processed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**Usage**:
- Every event has UUID event_id
- Before processing: check if event_id in table
- After processing: insert event_id
- Prevents duplicate writes on replays

**Benefits**:
- Idempotent processing
- Safe restarts without data loss or duplication
- Scales to multiple consumers

---

## Database Schema Expectations

### Tables Required

**inventory**:
- `part_id` (PK)
- `current_stock` (INT)
- `last_updated` (TIMESTAMP)

**inventory_analysis**:
- `part_id` (FK)
- `health_score` (FLOAT)
- `risk_level` (TEXT)
- `stock_gap` (INT)
- `supplier_risk` (BOOLEAN)
- `recommendation` (TEXT)
- `analyzed_at` (TIMESTAMP)

**trips**:
- `id` (PK)
- `trip_status` (TEXT)
- `route` (JSONB)

**vehicles**:
- `id` (PK)
- `vehicle_id` (INT)
- `lat` (FLOAT)
- `long` (FLOAT)

**suppliers**:
- `id` (PK)
- `max_daily_capacity` (INT)

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

## SQL Files

### init.sql
- CREATE TABLE statements
- Schema initialization
- Runs once on startup

### seed.sql
- INSERT seed data (parts, suppliers, initial trips)
- Runs once on startup
- Creates baseline data for testing

---

## Dependencies

- **psycopg2**: PostgreSQL driver
- **redis**: Redis client

---

## Key Design Patterns

1. **Event Sourcing**: All changes captured as immutable events
2. **Deduplication**: UUID-based idempotency prevents data corruption
3. **Write-Through**: Events persisted immediately (not batched)
4. **Eventual Consistency**: Data eventually consistent with Redis state
5. **Append-Only Analysis**: inventory_analysis creates new records (history preserved)

---

## Error Handling

- **Dedup Failures**: Silently ignored (idempotent)
- **Handler Errors**: Transaction rolled back, next retry on restart
- **Connection Loss**: Reconnect on next loop iteration
- **Malformed Events**: Caught by payload validation (if added)

---

## Performance Characteristics

- **Throughput**: Limited by DB commit speed (~100-1000 events/sec)
- **Latency**: ~10-50ms per event (includes DB round trip)
- **Memory**: Minimal (no buffering, stream offsets only)
- **Scalability**: Horizontal scaling via stream consumer groups (if implemented)


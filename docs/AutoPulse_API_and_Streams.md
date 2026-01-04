# 🚗 AutoPulse — API Endpoints & Redis Streams Reference

*A real-time, AI-powered control tower for automotive supply chains*

---

## 1. Redis Streams (Event Backbone)

AutoPulse uses **Redis Streams** to enable decoupled, replayable, real-time communication between microservices.

---

## 🔹 Core Input Streams

### `trip.route.requested`

**Produced by**: data_ingestion_service  
**Consumed by**: route_planner_service  

**Purpose**  
Request initial route planning.

**Payload**
```json
{
  "trip_id": 1,
  "vehicle_id": 1,
  "start_lat": 34.0522,
  "start_long": -118.2437,
  "dest_lat": 42.3314,
  "dest_long": -83.0458
}
```

---

### `vehicle.events`

**Produced by**: data_ingestion_service  
**Consumed by**: route_planner, API gateway, AI  

**Purpose**  
Live GPS telemetry.

**Payload**
```json
{
  "trip_id": 1,
  "vehicle_id": 1,
  "lat": 36.12,
  "long": -115.17,
  "speed_kmph": 78,
  "timestamp": "2026-01-03T18:45:12Z"
}
```

---

### `traffic.events`

**Produced by**: traffic generator  
**Consumed by**: route planner, AI  

**Payload**
```json
{
  "region": "Nevada",
  "severity": "HIGH",
  "event": "Accident",
  "impact_factor": 0.3
}
```

---

### `news.events`

**Produced by**: news generator  
**Consumed by**: route planner, AI  

**Payload**
```json
{
  "region": "Midwest",
  "type": "Weather",
  "description": "Heavy snowfall expected",
  "impact_factor": 0.4
}
```

---

### `inventory.events`

**Produced by**: assembly line simulator  
**Consumed by**: inventory service, persistence  

**Payload**
```json
{
  "part_id": 1,
  "delta": -5
}
```

---

## 🔹 Core Output Streams

### `route.plan.created`

**Produced by**: route_planner_service  
**Consumed by**: persist_database_service, API gateway  

**Purpose**  
Persist initial optimized route (once).

**Payload**
```json
{
  "trip_id": 1,
  "route": {
    "geometry": {
      "coordinates": [
        [-118.2437, 34.0522]
      ]
    },
    "distance_km": 3850,
    "duration_minutes": 2100
  },
  "confidence": 0.92
}
```

---

### `route.status.updated`

**Produced by**: route_planner_service  
**Consumed by**: API gateway, AI  

**Payload**
```json
{
  "trip_id": 1,
  "adjusted_eta_minutes": 2250,
  "delay_probability": 0.35,
  "reason": "TRAFFIC"
}
```

---

### `trip.delay.predicted`

**Produced by**: route_planner / AI  
**Consumed by**: API gateway, UI  

**Payload**
```json
{
  "trip_id": 1,
  "risk_level": "HIGH",
  "confidence": 0.8,
  "reason": "Weather + Traffic"
}
```

---

### `trip.started`
```json
{
  "trip_id": 1,
  "trip_status": "STARTED"
}
```

---

### `trip.completed`
```json
{
  "trip_id": 1,
  "trip_status": "COMPLETED",
  "part_id": 1,
  "quantity": 20
}
```

---

### `inventory.analysis.persist`

**Produced by**: inventory service  
**Consumed by**: persistence, API gateway  

```json
{
  "part_id": 1,
  "health_score": 35,
  "risk_level": "HIGH",
  "stock_gap": 22,
  "supplier_risk": true,
  "recommendation": "REPLENISH"
}
```

---

## 2. HTTP API Endpoints

### `GET /health`

**Response**
```json
{
  "status": "ok"
}
```

---

### `GET /vehicles`

**Purpose**  
Used by live map to render vehicle routes.

**Response**
```json
[
  {
    "trip_id": 1,
    "vehicle_id": 1,
    "vehicle_make": "Volvo FH",
    "route": {
      "geometry": {
        "coordinates": [
          [-118.2437, 34.0522]
        ]
      },
      "distance_km": 3850,
      "duration_minutes": 2100
    }
  }
]
```

---

### `GET /trips`

**Purpose**  
Trips overview table.

**Response**
```json
[
  {
    "trip_id": 1,
    "source": "Los Angeles",
    "destination": "Detroit",
    "part": "Battery Pack",
    "quantity": 20,
    "cost": 15000,
    "status": "STARTED"
  }
]
```

---

### `GET /inventory`

**Purpose**  
Inventory snapshot.

**Response**
```json
[
  {
    "part": "Battery Pack",
    "current_stock": 60,
    "minimum_required": 20,
    "criticality": "CRITICAL"
  }
]
```

---

### `GET /inventory/summary`

**Response**
```json
{
  "total_parts": 10,
  "parts_below_minimum": 3,
  "critical_parts_at_risk": 2,
  "active_replenishments": 1
}
```

---

### `GET /inventory/health`

**Response**
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

---

### `GET /inventory/part/{part_id}`

**Response**
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

---

### `GET /inventory/analysis/{part_id}`

**Response**
```json
[
  {
    "timestamp": "2026-01-04T09:00:00Z",
    "health_score": 52,
    "risk_level": "MEDIUM"
  },
  {
    "timestamp": "2026-01-04T10:15:00Z",
    "health_score": 35,
    "risk_level": "HIGH"
  }
]
```

---

## 3. WebSocket Interface

### `WS /ws/live`

**Purpose**  
Unified real-time feed (no polling).

**Message**
```json
{
  "stream": "vehicle.events",
  "payload": { }
}
```

Streams forwarded:
- vehicle.events
- route.status.updated
- trip.delay.predicted
- inventory.low_stock
- inventory.analysis.persist

---

## ✅ Summary

AutoPulse provides end-to-end, real-time visibility across logistics and inventory using streams, APIs, and predictive intelligence.

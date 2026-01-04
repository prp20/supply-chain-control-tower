# API Endpoints and Redis Streams along with description

## Core Input Streams
- trip.route.requested

    **Produced by**: data_ingestion_service <br>
    **Consumed by****: route_planner_service

    **Purpose**:
    Request initial route planning (startup)

    **Payload**

    {
        "trip_id": 1,
        "vehicle_id": 1,
        "start_lat": 34.0522,
        "start_long": -118.2437,
        "dest_lat": 42.3314,
        "dest_long": -83.0458
    }

- vehicle.events

    **Produced by**: data_ingestion_service <br>
    **Consumed by**: route planner, API gateway, AI

    **Purpose**: Live GPS telemetry

    **Payload**
    {
        "trip_id": 1,
        "vehicle_id": 1,
        "lat": 36.12,
        "long": -115.17,
        "speed_kmph": 78,
        "timestamp": "2026-01-03T18:45:12Z"
    }

- traffic.events

    **Produced by**: traffic generator <br>
    **Consumed by**: route planner, AI

    **Payload**

    {
        "region": "Nevada",
        "severity": "HIGH",
        "event": "Accident",
        "impact_factor": 0.3
    }

- news.events

    **Produced by**: news generator <br>
    **Consumed by**: route planner, AI

    **Payload**

    {
        "region": "Midwest",
        "type": "Weather",
        "description": "Heavy snowfall expected",
        "impact_factor": 0.4
    }

## Core Output Streams
- route.plan.created

    **Produced by**: route_planner_service <br>
    **Consumed by**: persist_database_service, API gateway

    **Purpose**:
    Persist route ONCE

    **Payload**

    {
    "trip_id": 1,
    "route": {
        "geometry": {
        "coordinates": [
            [-118.2437, 34.0522],
            ...
        ]
        },
        "distance_km": 3850,
        "duration_minutes": 2100
    },
    "confidence": 0.92
    }

    **Additional Notes**
    - Persisted to DB
    - Used by UI

- route.status.updated

    **Produced by**: route_planner_service <br>
    **Consumed by**: API gateway, AI

    **Purpose**:
    Operational updates (NO DB write)

    **Payload**

    {
        "trip_id": 1,
        "adjusted_eta_minutes": 2250,
        "delay_probability": 0.35,
        "reason": "TRAFFIC"
    }

    **Additional Notes**
    - Used for live UI + alerts

- trip.delay.predicted

    **Produced by**: route_planner_service / AI <br>
    **Consumed by**: API gateway, UI

    **Purpose**:
    Risk alerting

    **Payload**

    {
        "trip_id": 1,
        "risk_level": "HIGH",
        "confidence": 0.8,
        "reason": "Weather + Traffic"
    }

- trip.started

    **Produced by**: data ingestion <br>
    **Consumed by**: persistence, UI

    **Purpose**

    **Payload**
    {
        "trip_id": 1,
        "trip_status": "STARTED"
    }

- trip.completed
    {
        "trip_id": 1,
        "trip_status": "COMPLETED"
    }

## Core HTTP Andpoints

- GET /health

    **Purpose**: Liveness check <br>
    
    **Payload**

    {
        "status": "ok"
    }

- GET /vehicles

Purpose:
Used by Live Map to render:

OSRM routes

Vehicle–trip association

Response

[
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
      "distance_km": 3850,
      "duration_minutes": 2100
    }
  }
]


📌 Used by

React → Leaflet (polylines)

Initial vehicle placement

🔹 GET /trips

Purpose:
Trips navigation page (table view)

Response

[
  {
    "trip_id": 1,
    "status": "YET_TO_START",
    "part_id": 1,
    "quantity": 20,
    "cost_estimate": 15000
  }
]


📌 Used by

Trips page

Drill-down later

🔹 GET /inventory

Purpose:
Inventory visibility / heatmaps

Response

[
  {
    "part": "Battery Pack",
    "current_stock": 60,
    "minimum_required": 20,
    "criticality": "CRITICAL"
  }
]


📌 Used by

Inventory dashboard

Risk indicators

🔹 WS /ws/live

Purpose:
Real-time updates (NO polling)

Message format

{
  "stream": "vehicle.events",
  "payload": { ... }
}


📌 Used by

Live vehicle movement

Delay alerts

Risk visualization

Inventory Summary (KPIs)
Endpoint
GET /inventory/summary

What it returns
{
  "total_parts": 10,
  "parts_below_minimum": 3,
  "critical_parts_at_risk": 2,
  "active_replenishments": 1
}

How it’s computed

inventory table → stock

inventory_analysis (latest per part) → risk

trips → active auto-replenishments

Inventory Health (Heatmap / Main View)
Endpoint
GET /inventory/health

Why this is the most important API

This drives:

the inventory grid

color-coding

click → drill-down

Response
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

Inventory Drill-Down (Single Part)
Endpoint
GET /inventory/part/{part_id}

Purpose

Drives the right-side panel / modal.

Response
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

Inventory Analysis History (Optional, UI Charts)
Endpoint
GET /inventory/analysis/{part_id}

Why it’s useful

trend charts

judge credibility

post-mortem analysis
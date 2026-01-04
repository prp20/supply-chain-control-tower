from fastapi import APIRouter, HTTPException
from app.db import get_db_connection

router = APIRouter()

@router.get("/trips")
def get_trips():
    conn = get_db_connection()
    cur = conn.cursor()

    cur.execute("""
        SELECT
            t.id AS trip_id,
            t.trip_status,
            p.name AS part_name,
            t.number_of_parts,
            t.trip_cost_estimate,
            t.start_lat,
            t.start_long,
            t.dest_lat,
            t.dest_long
        FROM trips t
        JOIN parts p ON p.id = t.part_id
        ORDER BY t.id
    """)

    rows = cur.fetchall()
    conn.close()

    def location_label(lat, lon):
        # Simple deterministic labels for now
        if lat > 40:
            return "Detroit, MI"
        elif lon < -115:
            return "Los Angeles, CA"
        elif lon < -110:
            return "Phoenix, AZ"
        elif lon < -95:
            return "Houston, TX"
        return "Unknown"

    return [
        {
            "trip_id": r[0],
            "status": r[1],
            "part_name": r[2],
            "quantity": r[3],
            "cost": r[4],
            "source": location_label(r[5], r[6]),
            "destination": location_label(r[7], r[8])
        }
        for r in rows
    ]

@router.get("/trip/{trip_id}")
def get_trip_detail(trip_id: int):
    import json
    conn = get_db_connection()
    cur = conn.cursor()

    cur.execute("""
        SELECT
            t.id,
            v.id AS vehicle_id,
            v.vehicle_make,
            t.route,
            t.start_lat,
            t.start_long,
            t.dest_lat,
            t.dest_long
        FROM trips t
        JOIN vehicles v ON v.id = t.vehicle_id
        WHERE t.id = %s
    """, (trip_id,))

    row = cur.fetchone()
    conn.close()

    if not row:
        raise HTTPException(status_code=404, detail="Trip not found")

    # Parse route data if stored as JSON
    route_data = None
    if row[3]:
        try:
            route_data = json.loads(row[3]) if isinstance(row[3], str) else row[3]
        except:
            route_data = row[3]

    # Build response with geometry in GeoJSON format
    response = {
        "trip_id": row[0],
        "vehicle_id": row[1],
        "vehicle_make": row[2],
        "start_lat": row[4],
        "start_long": row[5],
        "dest_lat": row[6],
        "dest_long": row[7],
    }

    # Add route geometry if available
    if route_data:
        response["route"] = {
            "geometry": route_data.get("geometry"),
            "distance_km": route_data.get("distance_km"),
            "duration_minutes": route_data.get("duration_minutes")
        }
    else:
        # Fallback geometry if no route data available
        response["route"] = {
            "geometry": {
                "type": "LineString",
                "coordinates": [
                    [row[5], row[4]],  # start_long, start_lat
                    [row[7], row[6]]   # dest_long, dest_lat
                ]
            },
            "distance_km": None,
            "duration_minutes": None
        }

    return response
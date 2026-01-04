import threading
import time
import json
import redis
from app.db_reader import get_db_connection
from app.redis_producer import publish_event
from app.generators.vehicle_gps import stream_vehicle_gps
from app.generators.inventory_events import stream_inventory_events
from app.generators.supplier_capacity import stream_supplier_capacity
from app.generators.traffic_feed import stream_traffic
from app.generators.news_feed import stream_news

r = redis.Redis(host="redis", port=6379, decode_responses=True)

started_trips = set()

def handle_route_created():
    print("👂 Listening for route.plan.created events")

    while True:
        events = r.xread(
            {"route.plan.created": "$"},
            block=0
        )

        for _, messages in events:
            for _, data in messages:
                payload = json.loads(data["payload"])

                trip_id = payload["trip_id"]
                route = payload["route"]

                if trip_id in started_trips:
                    continue

                started_trips.add(trip_id)

                # Fetch vehicle_id for this trip
                conn = get_db_connection()
                cur = conn.cursor()
                cur.execute(
                    "SELECT vehicle_id FROM trips WHERE id = %s",
                    (trip_id,)
                )
                vehicle_id = cur.fetchone()[0]
                conn.close()

                # Emit trip.started
                publish_event(
                    "trip.started",
                    "TRIP_STARTED",
                    {
                        "trip_id": trip_id,
                        "trip_status": "STARTED"
                    }
                )

                # Start GPS generator for this vehicle
                threading.Thread(
                    target=stream_vehicle_gps,
                    args=(trip_id, vehicle_id, route),
                    daemon=True
                ).start()

                print(f"▶️ Trip {trip_id} started for vehicle {vehicle_id}")


def main():
    print("🚀 Starting data_ingestion_service")

    conn = get_db_connection()
    cursor = conn.cursor()

    # STEP 1: Request routes
    cursor.execute("""
        SELECT id, start_lat, start_long, dest_lat, dest_long
        FROM trips
        WHERE route = '{}'::jsonb
    """)
    trips = cursor.fetchall()

    print(f"📡 Requesting routes for {len(trips)} trips")

    for t in trips:
        publish_event(
            "trip.route.requested",
            "TRIP_ROUTE_REQUESTED",
            {
                "trip_id": t[0],
                "start_lat": float(t[1]),
                "start_long": float(t[2]),
                "dest_lat": float(t[3]),
                "dest_long": float(t[4])
            }
        )

    conn.close()

    # STEP 2: Load parts & suppliers (ONCE)
    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute("SELECT id FROM parts")
    parts = [{"part_id": r[0]} for r in cursor.fetchall()]

    cursor.execute("SELECT id FROM suppliers")
    suppliers = [{"supplier_id": r[0]} for r in cursor.fetchall()]

    conn.close()

    # STEP 3: Start background generators
    threading.Thread(
        target=stream_inventory_events,
        args=(parts,),
        daemon=True
    ).start()

    threading.Thread(
        target=stream_supplier_capacity,
        args=(suppliers,),
        daemon=True
    ).start()

    threading.Thread(target=stream_traffic, daemon=True).start()
    threading.Thread(target=stream_news, daemon=True).start()

    # STEP 4: Listen for route creation → start trips
    handle_route_created()

if __name__ == "__main__":
    main()

import threading
import time
from app.db_reader import get_db_connection
from app.redis_producer import publish_event
from app.generators.vehicle_gps import stream_vehicle_gps
from app.generators.inventory_events import stream_inventory_events
from app.generators.supplier_capacity import stream_supplier_capacity
from app.generators.traffic_feed import stream_traffic
from app.generators.news_feed import stream_news

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

    time.sleep(5)

    # STEP 2: Load vehicles WITH routes
    cursor.execute("""
        SELECT id, vehicle_id, route
        FROM trips
        WHERE route IS NOT NULL
    """)

    vehicles = [
        {
            "trip_id": r[0],
            "vehicle_id": r[1],
            "route": r[2]
        }
        for r in cursor.fetchall()
    ]

    # STEP 3: Start generators
    cursor.execute("SELECT id FROM parts")
    parts = [{"part_id": r[0]} for r in cursor.fetchall()]

    cursor.execute("SELECT id FROM suppliers")
    suppliers = [{"supplier_id": r[0]} for r in cursor.fetchall()]

    threading.Thread(target=stream_vehicle_gps, args=(vehicles,), daemon=True).start()
    threading.Thread(target=stream_inventory_events, args=(parts,), daemon=True).start()
    threading.Thread(target=stream_supplier_capacity, args=(suppliers,), daemon=True).start()
    threading.Thread(target=stream_traffic, daemon=True).start()
    threading.Thread(target=stream_news, daemon=True).start()

    print("✅ data_ingestion_service is streaming events")

    while True:
        time.sleep(1)

if __name__ == "__main__":
    main()

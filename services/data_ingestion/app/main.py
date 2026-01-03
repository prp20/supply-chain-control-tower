import threading
from app.db_reader import get_db_connection
from app.generators.vehicle_gps import stream_vehicle_gps
from app.generators.inventory_events import stream_inventory_events
from app.generators.supplier_capacity import stream_supplier_capacity
from app.generators.traffic_feed import stream_traffic
from app.generators.news_feed import stream_news

def main():
    print("🚀 Starting data_ingestion_service")

    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute("""
        SELECT t.id, t.vehicle_id, t.start_lat, t.start_long
        FROM trips t
        WHERE t.trip_status = 'YET_TO_START'
    """)
    vehicles = [
        {
            "trip_id": r[0],
            "vehicle_id": r[1],
            "lat": float(r[2]),
            "long": float(r[3])
        }
        for r in cursor.fetchall()
    ]

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
        pass

if __name__ == "__main__":
    main()

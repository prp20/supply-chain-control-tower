import time
import random
import redis
import psycopg2
from datetime import datetime

REDIS_HOST = "redis"
STREAM_NAME = "supply:events"

DB_CONFIG = {
    "host": "postgres",
    "dbname": "supply_chain",
    "user": "sc_user",
    "password": "sc_pass"
}

r = redis.Redis(host=REDIS_HOST, port=6379, decode_responses=True)

def get_parts_and_suppliers():
    conn = psycopg2.connect(**DB_CONFIG)
    cur = conn.cursor()

    cur.execute("""
        SELECT sp.part_id, sp.supplier_id
        FROM supplier_parts sp
    """)

    rows = cur.fetchall()
    cur.close()
    conn.close()
    return rows

def generate_event(part_id, supplier_id):
    base_lat = 39.5   # somewhere in US
    base_lon = -98.3

    delay = random.choice([0, 5, 10, 20])

    return {
        "vehicle_id": f"TRUCK-{random.randint(100,999)}",
        "supplier_id": supplier_id,
        "part_id": part_id,
        "latitude": round(base_lat + random.uniform(-1, 1), 6),
        "longitude": round(base_lon + random.uniform(-1, 1), 6),
        "speed_kmph": random.randint(40, 90),
        "eta_minutes": random.randint(60, 300),
        "delay_minutes": delay,
        "status": "DELAYED" if delay > 10 else "ON_TIME",
        "timestamp": int(time.time())
    }

def main():
    print("🚚 Vehicle Telemetry Generator Started")

    while True:
        try:
            parts = get_parts_and_suppliers()

            if not parts:
                print("⚠️ No supplier-part mapping found")
                time.sleep(5)
                continue

            part_id, supplier_id = random.choice(parts)

            event = generate_event(part_id, supplier_id)

            r.xadd(STREAM_NAME, event)
            print("📡 Event sent:", event)

            time.sleep(3)

        except Exception as e:
            print("❌ Error:", e)
            time.sleep(5)

if __name__ == "__main__":
    main()

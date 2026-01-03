import time
import random
import redis
import psycopg2
import json

# -----------------------
# CONFIG
# -----------------------
REDIS_HOST = "redis"
STREAM_NAME = "supply:events"
PUBSUB_CHANNEL = "control_tower"

DB_CONFIG = {
    "host": "postgres",
    "dbname": "supply_chain",
    "user": "sc_user",
    "password": "sc_pass"
}

r = redis.Redis(host=REDIS_HOST, port=6379, decode_responses=True)

# -----------------------
# LOAD PART-SUPPLIER MAP
# -----------------------
def get_parts_and_suppliers():
    conn = psycopg2.connect(**DB_CONFIG)
    cur = conn.cursor()
    cur.execute("SELECT part_id, supplier_id FROM supplier_parts")
    rows = cur.fetchall()
    cur.close()
    conn.close()
    return rows

# -----------------------
# VEHICLE STATE
# -----------------------
class Vehicle:
    def __init__(self, vehicle_id, part_id, supplier_id):
        self.vehicle_id = vehicle_id
        self.part_id = part_id
        self.supplier_id = supplier_id

        self.lat = 39.5 + random.uniform(-1, 1)
        self.lon = -98.3 + random.uniform(-1, 1)
        self.speed = random.randint(50, 80)

    def move(self):
        self.lat += random.uniform(-0.01, 0.01)
        self.lon += random.uniform(-0.01, 0.01)

        delay = random.choice([0, 0, 5, 10, 20])

        return {
            "event_type": "VEHICLE_TELEMETRY",
            "vehicle_id": self.vehicle_id,
            "supplier_id": self.supplier_id,
            "part_id": self.part_id,
            "latitude": round(self.lat, 6),
            "longitude": round(self.lon, 6),
            "speed_kmph": self.speed,
            "eta_minutes": random.randint(60, 300),
            "delay_minutes": delay,
            "status": "DELAYED" if delay > 10 else "ON_TIME",
            "timestamp": int(time.time())
        }

# -----------------------
# MAIN LOOP
# -----------------------
def main():
    print("🚚 Vehicle Telemetry Generator Started")

    parts = get_parts_and_suppliers()
    if not parts:
        print("❌ No supplier-part mapping found")
        return

    # Create persistent vehicles
    vehicles = []
    for i in range(10):
        part_id, supplier_id = random.choice(parts)
        vehicles.append(
            Vehicle(f"TRUCK-{100+i}", part_id, supplier_id)
        )

    print(f"✅ {len(vehicles)} vehicles initialized")

    while True:
        try:
            for v in vehicles:
                event = v.move()

                # Redis Stream (ML / Analytics)
                r.xadd(STREAM_NAME, event)

                # Redis PubSub (UI)
                r.publish(PUBSUB_CHANNEL, json.dumps(event))

                print(f"📡 {v.vehicle_id} → {event['latitude']},{event['longitude']}")

                # Small delay = natural streaming
                time.sleep(0.5)

        except Exception as e:
            print("❌ Generator error:", e)
            time.sleep(5)


if __name__ == "__main__":
    main()

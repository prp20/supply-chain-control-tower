import psycopg2
import time
import redis

DB_CONFIG = {
    "host": "postgres",
    "dbname": "supply_chain",
    "user": "sc_user",
    "password": "sc_pass"
}

r = redis.Redis(host="redis", port=6379, decode_responses=True)

def consume_inventory():
    conn = psycopg2.connect(**DB_CONFIG)
    cur = conn.cursor()

    print("🏭 Inventory consumption engine started")

    while True:
        # Simulate vehicle production
        cur.execute("""
            UPDATE inventory
            SET quantity = quantity - 1
            WHERE part_id IN (
                SELECT id FROM parts
                WHERE criticality = 'HIGH'
            )
        """)

        conn.commit()

        # Publish event
        r.publish("control_tower", "Inventory updated")

        time.sleep(10)

if __name__ == "__main__":
    consume_inventory()

from app.redis_consumer import consume
from app.db_reader import get_db_connection
from app.state import load_initial_inventory

def bootstrap_inventory():
    print("📦 Loading initial inventory snapshot")

    conn = get_db_connection()
    cur = conn.cursor()

    cur.execute("""
        SELECT
            i.part_id,
            i.current_stock,
            i.minimum_required,
            i.criticality
        FROM inventory i
    """)

    rows = [
        {
            "part_id": r[0],
            "current_stock": r[1],
            "minimum_required": r[2],
            "criticality": r[3]
        }
        for r in cur.fetchall()
    ]

    conn.close()
    load_initial_inventory(rows)

def main():
    bootstrap_inventory()
    print("📦 Inventory Service started")
    consume()

if __name__ == "__main__":
    main()
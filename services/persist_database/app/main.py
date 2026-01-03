import redis
from app.db import get_db_connection, run_sql_file
from app.redis_consumer import consume_events

def main():
    print("🔹 Starting persist_database_service")

    db_conn = get_db_connection()
    cursor = db_conn.cursor()
    BASE_DIR = "/app"
    try:
        print("🔹 Running init.sql")
        run_sql_file(cursor, f"{BASE_DIR}/sql/init.sql")
        db_conn.commit()
    except Exception as e:
        db_conn.rollback()
        print("❌ Seed failed:", e)
    
    try:
        print("🔹 Running seed.sql")
        run_sql_file(cursor, f"{BASE_DIR}/sql/seed.sql")
        db_conn.commit()
    except Exception as e:
        db_conn.rollback()
        print("❌ Seed failed:", e)

    # Dedup table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS processed_events (
            event_id TEXT PRIMARY KEY,
            processed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
    """)

    db_conn.commit()

    redis_client = redis.Redis(
        host="redis",
        port=6379,
        decode_responses=True
    )

    print("🔹 Listening to Redis streams")
    consume_events(redis_client, db_conn)

if __name__ == "__main__":
    main()

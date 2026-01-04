def is_event_processed(cursor, event_id: str) -> bool:
    cursor.execute(
        "SELECT 1 FROM processed_events WHERE event_id = %s",
        (event_id,)
    )
    return cursor.fetchone() is not None

def mark_event_processed(cursor, event_id: str):
    cursor.execute(
        "INSERT INTO processed_events (event_id) VALUES (%s)",
        (event_id,)
    )

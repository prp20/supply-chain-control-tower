def handle_trip_event(cursor, payload: dict):
    cursor.execute(
        """
        UPDATE trips
        SET trip_status = %s
        WHERE id = %s
        """,
        (
            payload["trip_status"],
            payload["trip_id"]
        )
    )

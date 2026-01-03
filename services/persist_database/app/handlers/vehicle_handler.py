def handle_vehicle_event(cursor, payload: dict):
    cursor.execute(
        """
        UPDATE trips
        SET trip_status = %s
        WHERE id = %s
        """,
        (
            payload.get("trip_status", "IN_PROGRESS"),
            payload["trip_id"]
        )
    )

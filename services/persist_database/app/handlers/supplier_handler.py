def handle_supplier_event(cursor, payload: dict):
    cursor.execute(
        """
        UPDATE suppliers
        SET max_daily_capacity = %s
        WHERE id = %s
        """,
        (
            payload["available_capacity"],
            payload["supplier_id"]
        )
    )

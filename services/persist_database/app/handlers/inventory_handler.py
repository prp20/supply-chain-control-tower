def handle_inventory_event(cursor, payload: dict):
    part_id = payload["part_id"]
    delta = payload["delta"]

    cursor.execute(
        """
        UPDATE inventory
        SET current_stock = current_stock + %s,
            last_updated = NOW()
        WHERE part_id = %s
        """,
        (delta, part_id)
    )

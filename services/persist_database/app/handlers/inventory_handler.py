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

def handle_inventory_analysis(cursor, payload):
    cursor.execute(
        """
        INSERT INTO inventory_analysis
        (part_id, health_score, risk_level, stock_gap, supplier_risk, recommendation)
        VALUES (%s, %s, %s, %s, %s, %s)
        """,
        (
            payload["part_id"],
            payload["health_score"],
            payload["risk_level"],
            payload["stock_gap"],
            payload["supplier_risk"],
            payload["recommendation"]
        )
    )
import json

def handle_trip_event(cursor, payload: dict):
    # Only update if this event actually carries a trip_status
    if "trip_status" not in payload:
        return

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


def handle_route_plan_updated(cursor, payload):
    cursor.execute(
        """
        UPDATE trips
        SET route = %s
        WHERE id = %s
        """,
        (
            json.dumps(payload["route"]),
            payload["trip_id"]
        )
    )

def handle_route_plan_created(cursor, payload):
    cursor.execute(
        """
        UPDATE trips
        SET route = %s
        WHERE id = %s
          AND (route IS NULL OR route = '{}'::jsonb)
        """,
        (
            json.dumps(payload["route"]),
            payload["trip_id"]
        )
    )
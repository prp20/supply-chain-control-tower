import redis
import json
from app.handlers.inventory_handler import handle_inventory_event
from app.handlers.vehicle_handler import handle_vehicle_event
from app.handlers.supplier_handler import handle_supplier_event
from app.handlers.trip_handler import handle_trip_event, handle_route_plan_updated, handle_route_plan_created
from app.dedup import is_event_processed, mark_event_processed

STREAM_HANDLERS = {
    "inventory.events": handle_inventory_event,
    "vehicle.events": handle_vehicle_event,
    "supplier.events": handle_supplier_event,

    # Trip lifecycle
    "trip.started": handle_trip_event,
    "trip.completed": handle_trip_event,

    # Routing
    "route.plan.created": handle_route_plan_created,

    # Risk / delay
    "trip.delay.predicted": handle_trip_event
}

def consume_events(redis_client, db_conn):
    cursor = db_conn.cursor()

    streams = {stream: "0" for stream in STREAM_HANDLERS.keys()}

    while True:
        events = redis_client.xread(streams, block=5000)
        for stream_name, messages in events:
            handler = STREAM_HANDLERS[stream_name]
            for message_id, data in messages:
                event_id = data.get("event_id")
                payload = json.loads(data["payload"])

                if is_event_processed(cursor, event_id):
                    continue

                handler(cursor, payload)
                mark_event_processed(cursor, event_id)

                db_conn.commit()

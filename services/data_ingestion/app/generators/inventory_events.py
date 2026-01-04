import random
import time
from app.redis_producer import publish_event
from app.schemas import inventory_event_schema

def stream_inventory_events(parts):
    while True:
        part = random.choice(parts)

        payload = inventory_event_schema(
            part_id=part["part_id"],
            delta=-random.randint(1, 5),
            reason="ASSEMBLY_LINE_USAGE"
        )

        publish_event("inventory.events", "INVENTORY_CONSUMED", payload)
        time.sleep(5)

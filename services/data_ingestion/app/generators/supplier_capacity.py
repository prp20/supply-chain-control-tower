import random
import time
from app.redis_producer import publish_event

def stream_supplier_capacity(suppliers):
    while True:
        supplier = random.choice(suppliers)

        payload = {
            "supplier_id": supplier["supplier_id"],
            "available_capacity": random.randint(200, 600)
        }

        publish_event("supplier.events", "SUPPLIER_CAPACITY_UPDATE", payload)
        time.sleep(10)

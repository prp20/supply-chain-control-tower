import random
import time
from app.redis_producer import publish_event
from app.schemas import vehicle_gps_schema

def stream_vehicle_gps(vehicles):
    while True:
        vehicle = random.choice(vehicles)

        payload = vehicle_gps_schema(
            vehicle_id=vehicle["vehicle_id"],
            trip_id=vehicle["trip_id"],
            lat=vehicle["lat"] + random.uniform(-0.01, 0.01),
            long=vehicle["long"] + random.uniform(-0.01, 0.01),
            speed=random.randint(40, 80)
        )

        publish_event("vehicle.events", "VEHICLE_GPS_UPDATE", payload)
        time.sleep(2)

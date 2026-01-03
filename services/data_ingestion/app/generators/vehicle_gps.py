import time
from app.redis_producer import publish_event

def stream_vehicle_gps(vehicles):
    print(f"🚚 Starting GPS for {len(vehicles)} vehicles")

    for v in vehicles:
        route = v["route"]

        # Safety check
        if not route or "geometry" not in route:
            continue

        coordinates = route["geometry"]["coordinates"]

        for lon, lat in coordinates:
            publish_event(
                "vehicle.events",
                "VEHICLE_GPS_UPDATE",
                {
                    "trip_id": v["trip_id"],
                    "vehicle_id": v["vehicle_id"],
                    "lat": lat,
                    "long": lon,
                    "speed": 60
                }
            )
            time.sleep(1)

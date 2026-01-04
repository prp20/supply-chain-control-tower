import time
from datetime import datetime
from app.redis_producer import publish_event

def stream_vehicle_gps(trip_id: int, vehicle_id: int, route: dict):
    """
    Streams GPS updates for a single vehicle along its OSRM route.
    Publishes to vehicle.events.<vehicle_id>
    """

    if not route or "geometry" not in route:
        print(f"❌ No route for trip {trip_id}")
        return

    coordinates = route["geometry"]["coordinates"]
    stream_name = f"vehicle.events.{vehicle_id}"

    print(f"🚚 Starting GPS stream for vehicle {vehicle_id}, trip {trip_id}")

    for lon, lat in coordinates:
        publish_event(
            stream_name,
            "VEHICLE_GPS_UPDATE",
            {
                "trip_id": trip_id,
                "vehicle_id": vehicle_id,
                "lat": lat,
                "long": lon,
                "speed_kmph": 60,
                "timestamp": datetime.utcnow().isoformat()
            }
        )
        time.sleep(1)

    # Trip completed
    publish_event(
        "trip.completed",
        "TRIP_COMPLETED",
        {
            "trip_id": trip_id,
            "trip_status": "COMPLETED"
        }
    )

    print(f"✅ Completed GPS stream for vehicle {vehicle_id}, trip {trip_id}")

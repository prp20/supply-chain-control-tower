def vehicle_gps_schema(vehicle_id, trip_id, lat, long, speed):
    return {
        "vehicle_id": vehicle_id,
        "trip_id": trip_id,
        "lat": lat,
        "long": long,
        "speed": speed
    }

def inventory_event_schema(part_id, delta, reason):
    return {
        "part_id": part_id,
        "delta": delta,
        "reason": reason
    }

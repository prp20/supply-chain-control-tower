def route_plan_updated_schema(
    trip_id,
    distance_km,
    base_eta_minutes,
    adjusted_eta_minutes,
    geometry,
    confidence
):
    return {
        "trip_id": trip_id,
        "route": {
            "distance_km": round(distance_km, 2),
            "base_eta_minutes": round(base_eta_minutes, 2),
            "adjusted_eta_minutes": round(adjusted_eta_minutes, 2),
            "geometry": geometry
        },
        "confidence": round(confidence, 2)
    }


def trip_delay_predicted_schema(
    trip_id,
    delay_probability,
    risk_factors
):
    return {
        "trip_id": trip_id,
        "delay_probability": round(delay_probability, 2),
        "main_risk_factors": risk_factors
    }

from app.redis_consumer import consume_events
from app.osrm_client import get_route
from app.route_engine import adjust_eta
from app.redis_producer import publish
from app.schemas import (
    route_plan_updated_schema,
    trip_delay_predicted_schema
)
from app.state import traffic_events, news_events

DETROIT_LAT = 42.3314
DETROIT_LON = -83.0458

def handle_event(stream, payload):
    if stream == "traffic.events":
        traffic_events.append(payload)

    elif stream == "news.events":
        news_events.append(payload)

    elif stream == "vehicle.events":
        route = get_route(
            payload["lat"],
            payload["long"],
            DETROIT_LAT,
            DETROIT_LON
        )

        adjusted_eta, delay_prob, risks = adjust_eta(
            route["duration_minutes"]
        )

        publish(
            "route.plan.updated",
            "ROUTE_PLAN_UPDATED",
            route_plan_updated_schema(
                payload["trip_id"],
                route["distance_km"],
                route["duration_minutes"],
                adjusted_eta,
                route["geometry"],
                confidence=1 - delay_prob
            )
        )

        publish(
            "trip.delay.predicted",
            "TRIP_DELAY_PREDICTED",
            trip_delay_predicted_schema(
                payload["trip_id"],
                delay_prob,
                risks
            )
        )

    elif stream == "trip.route.requested":
        route = get_route(
            payload["start_lat"],
            payload["start_long"],
            payload["dest_lat"],
            payload["dest_long"]
        )

        adjusted_eta, delay_prob, risks = adjust_eta(
            route["duration_minutes"]
        )

        publish(
            "route.plan.created",
            "ROUTE_PLAN_CREATED",
            {
                "trip_id": payload["trip_id"],
                "route": route,
                "adjusted_eta": adjusted_eta,
                "confidence": 1 - delay_prob
            }
        )

    elif stream in ("vehicle.events", "traffic.events", "news.events"):
        publish(
            "route.status.updated",
            "ROUTE_STATUS_UPDATED",
            {
                "trip_id": payload.get("trip_id"),
                "eta_adjustment_reason": stream
            }
        )


def main():
    print("🚦 Route Planner Service started")
    consume_events(handle_event)

if __name__ == "__main__":
    main()

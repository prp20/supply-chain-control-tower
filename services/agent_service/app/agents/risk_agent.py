def risk_agent(state):
    brain = state["brain"]
    events = brain.snapshot()

    decisions = []

    traffic_risk = False
    weather_risk = False
    supply_risk = False

    impacted_trips = set()
    impacted_parts = set()

    for event in events:
        stream = event["stream"]
        payload = event["payload"]

        if stream == "traffic.events":
            if payload.get("severity") in ("HIGH", "CRITICAL"):
                traffic_risk = True
                if payload.get("trip_id"):
                    impacted_trips.add(payload["trip_id"])

        elif stream == "news.events":
            if payload.get("confidence", 0) >= 0.6:
                weather_risk = True

        elif stream == "inventory.health.updated":
            if payload.get("risk_level") == "HIGH":
                supply_risk = True
                impacted_parts.add(payload.get("part_id"))

    if traffic_risk:
        decisions.append({
            "decision_type": "TRAFFIC_DISRUPTION_RISK",
            "affected_trips": list(impacted_trips),
            "confidence": 0.75,
            "reason": "High severity traffic events detected"
        })

    if weather_risk:
        decisions.append({
            "decision_type": "WEATHER_DISRUPTION_RISK",
            "confidence": 0.7,
            "reason": "Adverse weather conditions reported"
        })

    if supply_risk:
        decisions.append({
            "decision_type": "SUPPLY_CHAIN_RISK",
            "affected_parts": list(impacted_parts),
            "confidence": 0.8,
            "reason": "High inventory risk levels detected"
        })

    return {
        "decisions": decisions
    }

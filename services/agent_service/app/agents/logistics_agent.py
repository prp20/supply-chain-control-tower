def logistics_agent(state):
    brain = state["brain"]
    events = brain.snapshot()

    decisions = []

    for event in events:
        if event["stream"] == "route.status.updated":
            payload = event["payload"]

            decisions.append({
                "decision_type": "LOGISTICS_DELAY_RISK",
                "trip_id": payload.get("trip_id"),
                "confidence": 0.7,
                "reason": payload.get("eta_adjustment_reason", "UNKNOWN")
            })

    return {
        "decisions": decisions
    }

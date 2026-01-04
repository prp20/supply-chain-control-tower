def inventory_agent(state):
    brain = state["brain"]
    events = brain.snapshot()

    decisions = []

    for event in events:
        if event["stream"] == "inventory.replenishment.recommended":
            payload = event["payload"]
            decisions.append({
                "type": "REPLENISHMENT_RECOMMENDED",
                "part_id": payload["part_id"],
                "recommended_qty": payload["recommended_qty"],
                "confidence": 0.85,
                "reason": "Predicted stockout risk"
            })

    return {
        "decisions": decisions
    }

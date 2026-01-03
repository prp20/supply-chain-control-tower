from app.state import traffic_events, news_events

def adjust_eta(base_eta_minutes):
    delay = 0
    risk_factors = set()

    for t in traffic_events:
        if t.get("severity") == "HIGH":
            delay += t.get("expected_delay_minutes", 0)
            risk_factors.add("TRAFFIC")

    for n in news_events:
        if n.get("impact") == "LOGISTICS_DELAY":
            delay += 20 * n.get("confidence", 0.5)
            risk_factors.add(n.get("category", "NEWS"))

    adjusted_eta = base_eta_minutes + delay
    delay_probability = min(1.0, delay / base_eta_minutes) if base_eta_minutes else 0

    return adjusted_eta, delay_probability, list(risk_factors)

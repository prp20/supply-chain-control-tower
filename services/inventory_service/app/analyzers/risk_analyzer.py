def compute_health_score(part: dict) -> int:
    score = 100

    if part["criticality"] == "CRITICAL":
        score -= 30

    deficit = part["minimum_required"] - part["current_stock"]
    if deficit > 0:
        score -= min(40, deficit * 2)

    capacity = part.get("supplier_capacity", 100)
    if capacity < 50:
        score -= 20

    return max(score, 0)

def classify_risk(score: int) -> str:
    if score < 40:
        return "HIGH"
    if score < 70:
        return "MEDIUM"
    return "LOW"

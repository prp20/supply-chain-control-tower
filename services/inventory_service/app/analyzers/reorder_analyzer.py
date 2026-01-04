def needs_replenishment(part: dict) -> bool:
    return part["current_stock"] < part["minimum_required"]

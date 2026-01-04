def is_low_stock(part: dict) -> bool:
    return part["current_stock"] < part["minimum_required"]

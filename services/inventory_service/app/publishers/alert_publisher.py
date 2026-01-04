from app.redis_producer import publish_event
from app.analyzers.reorder_analyzer import needs_replenishment
def publish_low_stock(part_id, part):
    publish_event(
        "inventory.low_stock",
        "LOW_STOCK",
        {
            "part_id": part_id,
            "current_stock": part["current_stock"],
            "minimum_required": part["minimum_required"],
            "criticality": part["criticality"]
        }
    )

def publish_health(part_id, score, risk):
    publish_event(
        "inventory.health.updated",
        "HEALTH_UPDATED",
        {
            "part_id": part_id,
            "health_score": score,
            "risk_level": risk
        }
    )

def publish_replenishment(part_id, part):
    publish_event(
        "inventory.replenishment.recommended",
        "REPLENISH",
        {
            "part_id": part_id,
            "recommended_qty": part["minimum_required"] * 2,
            "reason": "LOW_STOCK_PREDICTED"
        }
    )

def publish_inventory_db_update(part_id, part):
    publish_event(
        "inventory.db.update",
        "INVENTORY_DB_UPDATE",
        {
            "part_id": part_id,
            "current_stock": part["current_stock"],
            "last_updated": part["last_updated"]
        }
    )

def publish_inventory_analysis(part_id, score, risk, part):
    publish_event(
        "inventory.analysis.persist",
        "INVENTORY_ANALYSIS",
        {
            "part_id": part_id,
            "health_score": score,
            "risk_level": risk,
            "stock_gap": part["minimum_required"] - part["current_stock"],
            "supplier_risk": part.get("supplier_capacity", 100) < 50,
            "recommendation": "REPLENISH"
            if needs_replenishment(part) else "OK"
        }
    )
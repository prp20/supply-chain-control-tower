import json
import redis
import time

from app.state import update_part, get_part, inventory_state
from app.analyzers.stock_analyzer import is_low_stock
from app.analyzers.risk_analyzer import compute_health_score, classify_risk
from app.analyzers.reorder_analyzer import needs_replenishment
from app.publishers.alert_publisher import (
    publish_low_stock,
    publish_health,
    publish_replenishment,
    publish_inventory_db_update,
    publish_inventory_analysis
)

# Redis connection
r = redis.Redis(host="redis", port=6379, decode_responses=True)

# Streams this service consumes
STREAMS = {
    "inventory.events": "0",     # delta stock changes
    "supplier.events": "0",      # capacity / lead-time risk
    "trip.completed": "0"        # replenishment arrival
}

# Periodic DB flush (absolute stock)
FLUSH_INTERVAL_SECONDS = 180  # 3 minutes
LAST_FLUSH = time.time()


def consume():
    global LAST_FLUSH
    print("📦 Inventory service listening to Redis streams")

    while True:
        events = r.xread(STREAMS, block=1000)

        for stream, messages in events:
            for msg_id, data in messages:
                payload = json.loads(data["payload"])

                part_id = None

                # -----------------------------
                # INVENTORY CONSUMPTION (DELTA)
                # -----------------------------
                if stream == "inventory.events":
                    part_id = payload["part_id"]
                    delta = payload["delta"]

                    part = get_part(part_id)
                    if not part:
                        continue

                    part["current_stock"] += delta
                    update_part(part_id, part)

                # -----------------------------
                # SUPPLIER CAPACITY UPDATE
                # -----------------------------
                elif stream == "supplier.events":
                    # supplier event may or may not be tied to a part
                    part_id = payload.get("part_id")
                    if not part_id:
                        continue

                    update_part(part_id, {
                        "supplier_capacity": payload["max_daily_capacity"]
                    })

                # -----------------------------
                # REPLENISHMENT ARRIVAL
                # -----------------------------
                elif stream == "trip.completed":
                    part_id = payload.get("part_id")
                    if not part_id:
                        continue

                    received_qty = payload.get("quantity", 0)
                    part = get_part(part_id)
                    if part:
                        part["current_stock"] += received_qty
                        update_part(part_id, part)

                else:
                    continue
                # -----------------------------
                # INTELLIGENCE & ANALYSIS
                # -----------------------------
                part = get_part(part_id)
                if not part:
                    continue

                # Reactive alert
                if is_low_stock(part):
                    publish_low_stock(part_id, part)

                # Predictive analytics
                score = compute_health_score(part)
                risk = classify_risk(score)

                publish_health(part_id, score, risk)

                # Persistable analysis (DB + UI + AI)
                publish_inventory_analysis(part_id, score, risk, part)
                
                # Autonomous replenishment (new order)
                # if needs_replenishment(part):
                #     publish_replenishment(part_id, part)

                # Advance stream offset
                STREAMS[stream] = msg_id

        # -----------------------------
        # PERIODIC ABSOLUTE DB SYNC
        # -----------------------------
        if time.time() - LAST_FLUSH > FLUSH_INTERVAL_SECONDS:
            for pid, part in inventory_state.items():
                publish_inventory_db_update(pid, part)
            LAST_FLUSH = time.time()

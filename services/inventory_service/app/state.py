from collections import defaultdict
import time

inventory_state = defaultdict(dict)

def load_initial_inventory(rows):
    for r in rows:
        part_id = r["part_id"]
        inventory_state[part_id] = {
            "current_stock": r["current_stock"],
            "minimum_required": r["minimum_required"],
            "criticality": r["criticality"],
            "supplier_capacity": r.get("supplier_capacity", 100),
            "last_updated": time.time()
        }

def update_part(part_id: int, data: dict):
    inventory_state[part_id].update(data)
    inventory_state[part_id]["last_updated"] = time.time()

def get_part(part_id: int):
    return inventory_state.get(part_id)

from pydantic import BaseModel
from typing import Optional

class InventoryEvent(BaseModel):
    part_id: int
    current_stock: int
    minimum_required: int
    criticality: str
    timestamp: str

class SupplierEvent(BaseModel):
    supplier_id: int
    part_id: int
    max_daily_capacity: int
    timestamp: str

class InventoryHealth(BaseModel):
    part_id: int
    health_score: int
    risk_level: str

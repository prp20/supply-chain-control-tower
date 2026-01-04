# app/schemas.py
from typing import TypedDict, List, Dict, Any
from app.state import BrainState

class GraphState(TypedDict):
    brain: BrainState
    decisions: List[Dict[str, Any]]

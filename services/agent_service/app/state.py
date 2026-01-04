from collections import deque
from typing import Deque, Dict, Any

class BrainState:
    def __init__(self, max_events: int = 100):
        self.events: Deque[Dict[str, Any]] = deque(maxlen=max_events)

    def add_event(self, stream: str, payload: dict):
        self.events.append({
            "stream": stream,
            "payload": payload
        })

    def snapshot(self):
        return list(self.events)

    def clear(self):
        self.events.clear()

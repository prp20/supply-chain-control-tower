import time
from app.redis_producer import publish_event

def stream_traffic():
    while True:
        payload = {
            "region": "Midwest-USA",
            "severity": "MEDIUM",
            "cause": "CONGESTION",
            "expected_delay_minutes": 25
        }

        publish_event("traffic.events", "TRAFFIC_UPDATE", payload)
        time.sleep(15)

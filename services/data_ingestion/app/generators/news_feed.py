import time
from app.redis_producer import publish_event

def stream_news():
    while True:
        payload = {
            "category": "WEATHER",
            "location": "Great Lakes Region",
            "impact": "LOGISTICS_DELAY",
            "confidence": 0.7
        }

        publish_event("news.events", "NEWS_ALERT", payload)
        time.sleep(20)

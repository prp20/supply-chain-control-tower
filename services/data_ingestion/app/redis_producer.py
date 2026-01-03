import redis
import json
import uuid
from datetime import datetime, UTC

redis_client = redis.Redis(
    host="redis",
    port=6379,
    decode_responses=True
)

def publish_event(stream: str, event_type: str, payload: dict):
    event = {
        "event_id": str(uuid.uuid4()),
        "event_type": event_type,
        "source": "data-ingestion-service",
        "timestamp": datetime.now(UTC).isoformat(),
        "payload": json.dumps(payload)
    }

    redis_client.xadd(stream, event)

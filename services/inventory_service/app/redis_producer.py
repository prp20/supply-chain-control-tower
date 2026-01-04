import json
import uuid
import redis

r = redis.Redis(host="redis", port=6379, decode_responses=True)

def publish_event(stream: str, event_type: str, payload: dict):
    event_id = str(uuid.uuid4())

    r.xadd(
        stream,
        {
            "event_id": event_id,
            "event_type": event_type,
            "payload": json.dumps(payload)
        }
    )

import redis
import json
import uuid
from datetime import datetime

r = redis.Redis(host="redis", port=6379, decode_responses=True)

def publish(stream, event_type, payload):
    r.xadd(stream, {
        "event_id": str(uuid.uuid4()),
        "event_type": event_type,
        "timestamp": datetime.utcnow().isoformat(),
        "payload": json.dumps(payload)
    })

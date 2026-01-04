# app/redis_publisher.py
import json
import redis
import uuid
import time

r = redis.Redis(host="redis", port=6379, decode_responses=True)


def publish_event(stream: str, event_type: str, payload: dict):
    r.xadd(
        stream,
        {
            "event_id": str(uuid.uuid4()),
            "event_type": event_type,
            "payload": json.dumps(payload),
            "timestamp": time.time()
        }
    )


def publish_decision(decision: dict):
    publish_event(
        "decision.events",
        "EXECUTIVE_DECISION",
        decision
    )


def publish_explanation(explanation: dict):
    publish_event(
        "decision.explanations",
        "EXECUTIVE_EXPLANATION",
        explanation
    )

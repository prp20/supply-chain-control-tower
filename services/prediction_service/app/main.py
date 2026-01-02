from fastapi import FastAPI
import redis
import threading
import json
import time
from datetime import datetime

# -------------------------------------------------
# App Setup
# -------------------------------------------------
app = FastAPI(title="Prediction Service")

redis_client = redis.Redis(
    host="redis",
    port=6379,
    decode_responses=True
)

STREAM_NAME = "supply:events"
GROUP_NAME = "prediction_group"
CONSUMER_NAME = "predictor_1"

FEATURE_KEY = "ml:features"

# -------------------------------------------------
# Redis Stream Setup
# -------------------------------------------------
def init_stream():
    try:
        redis_client.xgroup_create(
            STREAM_NAME,
            GROUP_NAME,
            id="0",
            mkstream=True
        )
        print("✅ Redis consumer group created")
    except redis.exceptions.ResponseError:
        print("ℹ️ Redis consumer group already exists")

# -------------------------------------------------
# Feature Store Update Logic
# -------------------------------------------------
def process_event(event: dict):
    """
    Updates rolling ML features stored in Redis
    """
    redis_client.hincrby(FEATURE_KEY, "total_events", 1)

    delay = int(event.get("delay_minutes", 0))
    status = event.get("status", "ON_TIME")

    if delay > 10:
        redis_client.hincrby(FEATURE_KEY, "delayed_shipments", 1)

    if status == "DELAYED":
        redis_client.hincrby(FEATURE_KEY, "high_risk_events", 1)

    redis_client.hincrbyfloat(FEATURE_KEY, "total_delay", delay)

# -------------------------------------------------
# Redis Stream Consumer
# -------------------------------------------------
def consume_events():
    print("📡 Prediction Engine listening to Redis stream...")

    while True:
        try:
            messages = redis_client.xreadgroup(
                GROUP_NAME,
                CONSUMER_NAME,
                {STREAM_NAME: ">"},
                count=10,
                block=5000
            )

            for _, events in messages:
                for event_id, data in events:
                    process_event(data)
                    redis_client.xack(STREAM_NAME, GROUP_NAME, event_id)

        except Exception as e:
            print("❌ Stream error:", e)
            time.sleep(2)

# -------------------------------------------------
# FastAPI Lifecycle
# -------------------------------------------------
@app.on_event("startup")
def startup():
    init_stream()
    threading.Thread(target=consume_events, daemon=True).start()

# -------------------------------------------------
# Health Check
# -------------------------------------------------
@app.get("/health")
def health():
    return {"status": "prediction service healthy"}

# -------------------------------------------------
# Prediction Endpoint
# -------------------------------------------------
@app.get("/predict")
def predict():
    f = redis_client.hgetall(FEATURE_KEY)

    total = int(f.get("total_events", 1))
    delayed = int(f.get("delayed_shipments", 0))
    high_risk = int(f.get("high_risk_events", 0))
    total_delay = float(f.get("total_delay", 0))

    avg_delay = total_delay / max(total, 1)

    risk_score = min(
        1.0,
        (delayed * 0.4 + high_risk * 0.6) / max(total, 1)
    )

    return {
        "generated_at": datetime.utcnow().isoformat(),
        "risk_score": round(risk_score, 2),
        "avg_delay_minutes": round(avg_delay, 1),
        "risk_level": (
            "HIGH" if risk_score > 0.7
            else "MEDIUM" if risk_score > 0.4
            else "LOW"
        ),
        "features": {
            "total_events": total,
            "delayed_shipments": delayed,
            "high_risk_events": high_risk
        }
    }

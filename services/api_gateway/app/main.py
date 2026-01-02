from fastapi import FastAPI, Request, WebSocket, WebSocketDisconnect
from fastapi.responses import JSONResponse
import requests
from datetime import datetime, UTC
import os
import asyncio
import redis
import json

# -------------------------------------------------
# App
# -------------------------------------------------
app = FastAPI(title="Supply Chain Control Tower")
redis_client = redis.Redis(host="redis", port=6379, decode_responses=True)
# -------------------------------------------------
# Service URLs (Docker service names)
# -------------------------------------------------
PREDICTION_URL = os.getenv("PREDICTION_URL", "http://prediction-service:8000/predict")
AGENT_URL = os.getenv("AGENT_URL", "http://agent-service:8000/recommend")

# -------------------------------------------------
# Health
# -------------------------------------------------
@app.get("/health")
def health():
    return {
        "status": "ok",
        "service": "api-gateway",
        "time": datetime.now(UTC).isoformat()
    }

# -------------------------------------------------
# Control Tower Endpoint
# -------------------------------------------------
@app.post("/control-tower")
def control_tower():
    response = {
        "generated_at": datetime.now(UTC).isoformat(),
        "prediction": None,
        "decision": None,
        "errors": []
    }

    # ----------------------------
    # 1. Prediction
    # ----------------------------
    try:
        pred = requests.get(PREDICTION_URL, timeout=5).json()
        response["prediction"] = pred
    except Exception as e:
        response["errors"].append(f"Prediction error: {str(e)}")
        return JSONResponse(response, status_code=500)

    # ----------------------------
    # 2. Agent Decision
    # ----------------------------
    try:
        agent_payload = {
            "risk_score": pred["risk_score"],
            "avg_delay_minutes": pred["avg_delay_minutes"],
            "features": pred["features"]
        }

        agent = requests.post(
            AGENT_URL,
            json=agent_payload,
            timeout=5
        ).json()

        response["decision"] = agent

    except Exception as e:
        response["errors"].append(f"Agent error: {str(e)}")

    return response

@app.websocket("/ws")
async def websocket_endpoint(ws: WebSocket):
    await ws.accept()
    print("🟢 WebSocket client connected")

    pubsub = redis_client.pubsub()
    pubsub.subscribe("control_tower")

    try:
        while True:
            message = pubsub.get_message(ignore_subscribe_messages=True)

            if message:
                await ws.send_text(message["data"])

            await asyncio.sleep(1)
    except WebSocketDisconnect:
        print("🔴 WebSocket disconnected")

@app.get("/stream")
def read_stream():
    entries = redis_client.xrevrange("supply:events", count=20)
    return [
        {
            "id": eid,
            "data": data
        }
        for eid, data in entries
    ]

@app.get("/decisions")
def get_decisions():
    items = redis_client.lrange("agent:decisions", 0, 20)
    return [json.loads(i) for i in items]

@app.get("/metrics")
def metrics():
    f = redis_client.hgetall("ml:features")

    total = int(f.get("total_events", 0))
    delayed = int(f.get("delayed_shipments", 0))
    high = int(f.get("high_risk_events", 0))
    avg_delay = float(f.get("total_delay", 0)) / max(total, 1)

    return {
        "total_events": total,
        "delayed_shipments": delayed,
        "high_risk_events": high,
        "avg_delay": round(avg_delay, 2)
    }
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from datetime import datetime, UTC
import redis
import json
import requests
import asyncio
import threading
import psycopg2

app = FastAPI(title="Supply Chain Control Tower")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # or ["http://localhost:3000"]
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
# Redis
redis_client = redis.Redis(host="redis", port=6379, decode_responses=True)

# Services
PREDICTION_URL = "http://prediction-service:8000/predict"
AGENT_URL = "http://agent-service:8000/recommend"

# WebSocket clients
connected_clients = set()

# ---------------------------
# HEALTH
# ---------------------------
@app.get("/health")
def health():
    return {
        "status": "ok",
        "service": "api-gateway",
        "time": datetime.now(UTC).isoformat()
    }

# ---------------------------
# CONTROL TOWER (Manual Trigger)
# ---------------------------
@app.post("/control-tower")
def control_tower():
    response = {
        "generated_at": datetime.now(UTC).isoformat(),
        "prediction": None,
        "decision": None,
        "errors": []
    }

    try:
        prediction = requests.get(PREDICTION_URL, timeout=5).json()
        response["prediction"] = prediction
    except Exception as e:
        response["errors"].append(f"Prediction error: {e}")
        return response

    try:
        decision = requests.post(
            AGENT_URL,
            json=prediction,
            timeout=5
        ).json()

        response["decision"] = decision
    except Exception as e:
        response["errors"].append(f"Agent error: {e}")

    return response


@app.get("/metrics")
def get_metrics():
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


@app.get("/stream")
def read_stream():
    entries = redis_client.xrevrange("supply:events", count=20)

    cleaned = []
    for eid, data in entries:
        cleaned.append({
            "id": eid,
            **data
        })

    return cleaned

@app.get("/inventory")
def get_inventory():
    conn = psycopg2.connect(
        host="postgres",
        dbname="supply_chain",
        user="sc_user",
        password="sc_pass"
    )
    cur = conn.cursor()

    cur.execute("""
        SELECT
            p.id AS part_id,
            p.part_name,
            p.criticality,
            p.unit_cost,
            i.quantity,
            s.name AS supplier_name,
            s.country,
            sp.lead_time_days,
            sp.capacity_per_day
        FROM inventory i
        JOIN parts p ON i.part_id = p.id
        JOIN supplier_parts sp ON sp.part_id = p.id
        JOIN suppliers s ON s.id = sp.supplier_id
        ORDER BY p.id;
    """)

    rows = cur.fetchall()
    cur.close()
    conn.close()

    return [
        {
            "part_id": r[0],
            "part_name": r[1],
            "criticality": r[2],
            "unit_cost": float(r[3]),
            "quantity": r[4],
            "supplier": r[5],
            "country": r[6],
            "lead_time_days": r[7],
            "capacity_per_day": r[8],
        }
        for r in rows
    ]


# ---------------------------
# WEBSOCKET
# ---------------------------
@app.websocket("/ws")
async def websocket_endpoint(ws: WebSocket):
    await ws.accept()
    print("🟢 WebSocket connected")

    pubsub = redis_client.pubsub()
    pubsub.subscribe("control_tower")

    try:
        while True:
            message = pubsub.get_message(ignore_subscribe_messages=True)

            if message:
                try:
                    data = json.loads(message["data"])
                except Exception:
                    # fallback for non-json messages
                    data = {
                        "type": "log",
                        "message": str(message["data"])
                    }

                await ws.send_json(data)

            await asyncio.sleep(0.5)

    except WebSocketDisconnect:
        print("🔴 WebSocket disconnected")


# ---------------------------
# REDIS LISTENER (BACKGROUND)
# ---------------------------
def redis_listener():
    pubsub = redis_client.pubsub()
    pubsub.subscribe("control_tower")

    for msg in pubsub.listen():
        if msg["type"] != "message":
            continue

        try:
            data = json.loads(msg["data"])
        except:
            continue

        for ws in list(connected_clients):
            try:
                asyncio.run(ws.send_json(data))
            except:
                connected_clients.remove(ws)


@app.on_event("startup")
def start_background():
    threading.Thread(target=redis_listener, daemon=True).start()



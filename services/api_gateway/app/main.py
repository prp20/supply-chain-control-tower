from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
import requests
from datetime import datetime
import os

# -------------------------------------------------
# App
# -------------------------------------------------
app = FastAPI(title="Supply Chain Control Tower")

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
        "time": datetime.utcnow().isoformat()
    }

# -------------------------------------------------
# Control Tower Endpoint
# -------------------------------------------------
@app.post("/control-tower")
def control_tower():
    response = {
        "generated_at": datetime.utcnow().isoformat(),
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

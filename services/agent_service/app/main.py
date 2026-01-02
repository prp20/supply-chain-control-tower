from fastapi import FastAPI
import redis
import json
import os
import re
from datetime import datetime
from typing import TypedDict
from dotenv import load_dotenv

from langgraph.graph import StateGraph
from langchain_groq import ChatGroq
from langchain_core.messages import SystemMessage, HumanMessage

load_dotenv()

# -------------------------------------------------
# App + Redis
# -------------------------------------------------
app = FastAPI(title="Agent Brain")

redis_client = redis.Redis(
    host="redis",
    port=6379,
    decode_responses=True
)

# -------------------------------------------------
# LLM
# -------------------------------------------------
llm = ChatGroq(
    api_key=os.getenv("GROQ_API_KEY"),
    model_name="llama-3.1-8b-instant"
)

# -------------------------------------------------
# Agent State
# -------------------------------------------------
class AgentState(TypedDict):
    prediction: dict
    risk_analysis: dict
    logistics: dict
    inventory: dict
    decision: dict

# -------------------------------------------------
# Utilities
# -------------------------------------------------
def safe_json(text: str) -> dict:
    """Safely extract JSON from LLM output."""
    if not text:
        return {}

    text = re.sub(r"```json|```", "", text).strip()
    try:
        return json.loads(text)
    except Exception:
        return {}

# -------------------------------------------------
# Nodes
# -------------------------------------------------

def ingest_node(state: AgentState):
    """Guarantee prediction exists"""
    return {
        "prediction": state.get("prediction", {})
    }


def risk_agent(state: AgentState):
    p = state["prediction"]

    prompt = f"""
You are a supply chain risk analyst.

Input:
- Risk Score: {p.get("risk_score")}
- Avg Delay: {p.get("avg_delay_minutes")}
- High Risk Events: {p.get("features", {}).get("high_risk_events")}

Return ONLY JSON:
{{
  "risk_level": "HIGH | MEDIUM | LOW",
  "summary": "short explanation"
}}
"""

    res = llm.invoke([
        SystemMessage(content="You are an expert supply chain AI."),
        HumanMessage(content=prompt)
    ])

    data = safe_json(res.content)

    return {
        "risk_analysis": {
            "risk_level": data.get("risk_level", "MEDIUM"),
            "summary": data.get("summary", "No clear risk identified")
        }
    }


def logistics_agent(state: AgentState):
    risk = state["risk_analysis"]["risk_level"]

    action = (
        "Reroute shipments and expedite freight"
        if risk == "HIGH"
        else "Monitor shipments"
    )

    return {
        "logistics": {
            "action": action
        }
    }


def inventory_agent(state: AgentState):
    risk = state["risk_analysis"]["risk_level"]

    action = (
        "Increase buffer stock by 20%"
        if risk == "HIGH"
        else "Maintain current inventory"
    )

    return {
        "inventory": {
            "action": action
        }
    }


def decision_node(state: AgentState):
    decision = {
        "risk": state["risk_analysis"],
        "logistics": state["logistics"],
        "inventory": state["inventory"]
    }

    payload = {
        "timestamp": datetime.utcnow().isoformat(),
        "decision": decision
    }

    # Publish to Redis for UI
    redis_client.publish("control_tower", json.dumps(payload))

    # Save history
    redis_client.lpush("agent:history", json.dumps(payload))
    redis_client.ltrim("agent:history", 0, 50)

    return {
        "decision": decision
    }

# -------------------------------------------------
# LangGraph Setup
# -------------------------------------------------
graph = StateGraph(AgentState)

graph.add_node("ingest", ingest_node)
graph.add_node("risk", risk_agent)
graph.add_node("logistics", logistics_agent)
graph.add_node("inventory", inventory_agent)
graph.add_node("decision", decision_node)

graph.set_entry_point("ingest")
graph.add_edge("ingest", "risk")
graph.add_edge("risk", "logistics")
graph.add_edge("logistics", "inventory")
graph.add_edge("inventory", "decision")
graph.set_finish_point("decision")

agent_app = graph.compile()

# -------------------------------------------------
# API
# -------------------------------------------------
@app.get("/health")
def health():
    return {"status": "agent online"}

@app.post("/recommend")
def recommend(payload: dict):
    result = agent_app.invoke({
        "prediction": payload
    })

    return {
        "timestamp": datetime.utcnow().isoformat(),
        "decision": result["decision"]
    }

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
# App
# -------------------------------------------------
app = FastAPI(title="Agent Brain")

redis_client = redis.Redis(host="redis", port=6379, decode_responses=True)

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
# UTILITY: Parse JSON safely
# -------------------------------------------------
def extract_json(text: str) -> dict:
    """Extract JSON from LLM response, handling markdown formatting."""
    if not text or not text.strip():
        raise ValueError("Empty response from LLM")
    
    # Remove markdown code blocks if present
    text = re.sub(r'```json\n?|\n?```', '', text)
    text = text.strip()
    
    try:
        return json.loads(text)
    except json.JSONDecodeError as e:
        raise ValueError(f"Failed to parse JSON: {text[:100]}...") from e

# -------------------------------------------------
# AGENT NODES
# -------------------------------------------------

def risk_agent(state: AgentState):
    p = state["prediction"]

    prompt = f"""You are a supply chain risk analyst.

Input:
- Risk Score: {p['risk_score']}
- Avg Delay: {p['avg_delay_minutes']}
- High Risk Events: {p['features']['high_risk_events']}

Return ONLY valid JSON (no markdown, no extra text):
{{
  "risk_level": "HIGH or MEDIUM or LOW",
  "summary": "Brief analysis summary"
}}"""

    res = llm.invoke([
        SystemMessage(content="You analyze operational risk. Always respond with valid JSON only."),
        HumanMessage(content=prompt)
    ])

    try:
        risk_data = extract_json(res.content)
    except ValueError as e:
        print(f"Error parsing risk response: {e}")
        # Fallback to safe defaults
        risk_data = {
            "risk_level": "MEDIUM",
            "summary": "Unable to analyze risk"
        }

    return {
        "risk_analysis": risk_data
    }


def logistics_agent(state: AgentState):
    risk = state["risk_analysis"].get("risk_level", "MEDIUM")

    action = (
        "Reroute shipments and expedite freight"
        if risk == "HIGH"
        else "Monitor shipments"
    )

    return {
        "logistics": {
            "recommended_action": action
        }
    }


def inventory_agent(state: AgentState):
    risk = state["risk_analysis"].get("risk_level", "MEDIUM")

    inventory_action = (
        "Increase safety stock"
        if risk == "HIGH"
        else "No change"
    )

    return {
        "inventory": {
            "inventory_action": inventory_action
        }
    }


def decision_agent(state: AgentState):
    decision = {
        "risk": state["risk_analysis"],
        "logistics": state["logistics"],
        "inventory": state["inventory"]
    }

    return {
        "decision": decision
    }

# -------------------------------------------------
# LANGGRAPH
# -------------------------------------------------
graph = StateGraph(AgentState)

graph.add_node("risk", risk_agent)
graph.add_node("logistics", logistics_agent)
graph.add_node("inventory", inventory_agent)
graph.add_node("decision", decision_agent)

graph.set_entry_point("risk")
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
    return {"status": "ok"}

@app.post("/recommend")
def recommend(payload: dict):
    result = agent_app.invoke({
        "prediction": payload
    })

    output = {
        "timestamp": datetime.utcnow().isoformat(),
        "decision": result["decision"]
    }

    redis_client.publish("control_tower", json.dumps(output))

    return output
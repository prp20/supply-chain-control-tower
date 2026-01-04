# graph.py
from langgraph.graph import StateGraph, END
from app.schemas import GraphState
from app.agents.inventory_agent import inventory_agent
from app.agents.logistics_agent import logistics_agent
from app.agents.risk_agent import risk_agent
from app.agents.executive_agent import executive_agent

def build_graph():
    graph = StateGraph(GraphState)

    graph.add_node("inventory", inventory_agent)
    graph.add_node("logistics", logistics_agent)
    graph.add_node("risk", risk_agent)
    graph.add_node("executive", executive_agent)

    graph.set_entry_point("inventory")

    graph.add_edge("inventory", "logistics")
    graph.add_edge("logistics", "risk")
    graph.add_edge("risk", "executive")
    graph.add_edge("executive", END)  # 🔴 REQUIRED

    return graph.compile()

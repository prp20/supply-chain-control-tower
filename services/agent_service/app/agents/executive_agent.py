from langchain_groq import ChatGroq

llm = ChatGroq(
    model="llama-3.1-8b-instant",
    temperature=0.2
)

def executive_agent(state):
    decisions = state.get("decisions", [])

    if not decisions:
        return {"decisions": []}

    prompt = f"""
You are an Executive AI for an Automobile Supply Chain Control Tower.

Below are structured system decisions:
{decisions}

Tasks:
1. Identify the most critical issue
2. Assign priority (HIGH / MEDIUM / LOW)
3. Recommend ONE immediate action
4. Explain WHY

Respond concisely.
"""

    response = llm.invoke(prompt)

    executive_decision = {
        "decision_type": "EXECUTIVE_ACTION",
        "priority": "HIGH",
        "recommendation": response.content,
        "confidence": 0.85
    }

    return {
        "decisions": [executive_decision]
    }


# AutoPulse – Autonomous Supply Chain Control Tower

AutoPulse is an end-to-end **AI-driven Supply Chain Control Tower** designed for real-time logistics visibility, predictive inventory intelligence, and autonomous decision-making.

Built as a **microservices + event-driven + agentic AI** system, AutoPulse demonstrates how modern enterprises can move from reactive firefighting to proactive, intelligent operations.

---

## 🧠 Core Vision

> *“From raw signals → real-time intelligence → autonomous decisions.”*

AutoPulse continuously ingests live operational events, reasons over them using multi-agent AI workflows, and delivers actionable insights through real-time dashboards.

---

## 🏗️ High-Level Architecture

- **PostgreSQL** – System of record
- **Redis Streams** – Event backbone
- **FastAPI API Gateway** – Unified control plane
- **React + Leaflet UI** – Real-time visualization
- **LangGraph + LangChain + Groq LLM** – Agentic AI brain

---

## 🔧 Services Overview

### 1. Data Ingestion Service
Simulates real-world signals:
- Vehicle GPS telemetry
- Traffic disruptions
- News & weather events
- Inventory consumption

### 2. Route Planner Service
- OSRM-based routing
- ETA adjustment & delay prediction
- Dynamic rerouting intelligence

### 3. Inventory Intelligence Service
- Stock tracking & safety thresholds
- Health scoring & risk classification
- Replenishment recommendations

### 4. Persist Database Service
- Event-driven database updates
- Idempotent stream handling
- Analytics persistence

### 5. API Gateway
- REST APIs for dashboards
- WebSocket streaming for live updates
- Unified data aggregation layer

### 6. Master Brain Service (Agentic AI)
- Inventory Agent
- Logistics Agent
- Risk Correlation Agent
- Executive Decision Agent (Groq LLM)

Built using **LangGraph** for structured, explainable reasoning workflows.

---

## 🔁 Event-Driven Backbone (Redis Streams)

Examples:
- `vehicle.events`
- `route.plan.created`
- `route.status.updated`
- `inventory.health.updated`
- `decision.events`

All services communicate asynchronously through Redis Streams for scalability and resilience.

---

## 🧠 Agentic AI Highlights

- Memory-based reasoning window
- Multi-agent collaboration
- Deterministic + probabilistic decisions
- Executive-grade explanations
- Fully explainable AI decisions

---

## 🖥️ Frontend (React + Leaflet)

Key dashboards:
- Live vehicle movement
- Trip status & delays
- Inventory health heatmaps
- Risk alerts & recommendations
- AI-generated executive insights

---

## 🚀 How to Run

```bash
docker-compose up --build
```

Services will be available at:
- API Gateway: http://localhost:8000
- UI Dashboard: http://localhost:3000

---

## 🏆 Why AutoPulse Stands Out

- True **agentic AI**, not rule engines
- End-to-end real-time visibility
- Production-grade architecture
- Highly extensible
- Hackathon-ready & enterprise-aligned

---

## 📌 Future Enhancements

- Autonomous procurement execution
- Long-horizon demand forecasting
- Reinforcement learning for routing
- Multi-region simulation
- Role-based UI views

---

## 👨‍💻 Author

Designed & built as a **future-ready autonomous operations platform** showcasing modern AI-driven system design.

---

*AutoPulse — Where Supply Chains Think Ahead.*

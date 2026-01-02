# 🚗 Supply Chain Control Tower – AI Powered

A **real-time, AI-driven supply chain monitoring system** built using:

* 🧠 Agentic AI (LangGraph + Groq LLM)
* ⚡ Event Streaming (Redis Streams)
* 📦 Inventory & Supply Tracking
* 📊 Prediction Engine
* 🌐 React Dashboard
* 🐳 Fully Dockerized Microservices

---

## 📌 Architecture Overview

```
┌──────────────┐
│  React UI    │
│ (Dashboard)  │
└──────┬───────┘
       │
       ▼
┌──────────────┐
│ API Gateway  │
└──────┬───────┘
       │
 ┌─────┴───────────────┐
 │                     │
 ▼                     ▼
Prediction Service   Agent Service
(ML + Redis)         (LangGraph + LLM)
 │                     │
 └─────────┬───────────┘
           ▼
      Redis Streams
           │
           ▼
     Event Generator
```

---

## ⚙️ Tech Stack

| Layer     | Technology       |
| --------- | ---------------- |
| UI        | React + Nginx    |
| Backend   | FastAPI          |
| AI        | LangGraph + Groq |
| Streaming | Redis Streams    |
| DB        | PostgreSQL       |
| Infra     | Docker + Compose |

---

## 📂 Folder Structure

```
.
├── docker-compose.yml
├── services/
│   ├── api-gateway/
│   ├── prediction-service/
│   ├── agent-service/
│   ├── event-generator/
│   └── data-service/
│
├── ui/
│   └── control-tower-ui/
│
└── infra/
    └── postgres/
```

---

## 🚀 How to Run the System

### 1️⃣ Prerequisites

* Docker
* Docker Compose
* Git

---

### 2️⃣ Clone Repo

```bash
git clone https://github.com/<your-username>/supply-chain-control-tower.git
cd supply-chain-control-tower
```

---

### 3️⃣ Start Everything

```bash
docker-compose up --build
```

---

### 4️⃣ Access Services

| Service        | URL                                                                        |
| -------------- | -------------------------------------------------------------------------- |
| UI             | [http://localhost:3000](http://localhost:3000)                             |
| API Gateway    | [http://localhost:8000](http://localhost:8000)                             |
| Prediction API | [http://localhost:8000/control-tower](http://localhost:8000/control-tower) |
| Agent Health   | [http://localhost:8000/health](http://localhost:8000/health)               |

---

## 🧠 AI Capabilities

### ✔ Real-time Event Processing

* Vehicle telemetry
* Shipment delays
* Inventory changes

### ✔ Prediction Engine

* Rolling risk score
* Delay forecasting
* Inventory impact

### ✔ Agentic AI

* Uses LangGraph
* Groq LLM (Llama-3)
* Autonomous decision making
* Outputs:

  * Risk Level
  * Action
  * Explanation

---

## 🔁 Event Flow

```
Event Generator → Redis Stream
      ↓
Prediction Engine
      ↓
Agent Brain
      ↓
UI Dashboard
```

---

## 📊 Example API Response

```json
{
  "risk_score": 0.67,
  "risk_level": "HIGH",
  "avg_delay_minutes": 12.5,
  "decision": "Increase buffer stock and reroute shipments"
}
```

---

## 🧠 Future Enhancements

* ✅ WebSocket live updates
* 📍 GPS map tracking
* 📦 Supplier risk scoring
* 📈 Grafana dashboard
* 🤖 Multi-agent negotiation
* 🧠 Model retraining

---

## 🧑‍💻 Author

Built by **[Your Name]**
AI + Supply Chain Systems Architect

---

## ⭐ Star This Repo

If this helped you — give it a ⭐ on GitHub!

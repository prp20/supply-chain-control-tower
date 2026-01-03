import asyncio
from fastapi import FastAPI, WebSocket
from fastapi.middleware.cors import CORSMiddleware
from app.websocket_manager import ConnectionManager
from app.redis_listener import redis_stream_listener
from app.routes import vehicles, trips, inventory, health

app = FastAPI(title="Control Tower API Gateway")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # or ["http://localhost:3000"]
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
manager = ConnectionManager()

app.include_router(health.router)
app.include_router(vehicles.router)
app.include_router(trips.router)
app.include_router(inventory.router)

@app.websocket("/ws/live")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        while True:
            await websocket.receive_text()
    except:
        manager.disconnect(websocket)

@app.on_event("startup")
async def startup_event():
    asyncio.create_task(redis_stream_listener(manager))

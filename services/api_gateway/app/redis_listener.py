import json
import asyncio
from app.redis_client import redis_client
from app.websocket_manager import ConnectionManager

STREAMS = {
    "vehicle.events": "0",
    "route.status.updated": "0",
    "trip.delay.predicted": "0"
}

async def redis_stream_listener(manager: ConnectionManager):
    while True:
        events = redis_client.xread(STREAMS, block=1000)
        for stream, messages in events:
            for msg_id, data in messages:
                payload = json.loads(data.get("payload", "{}"))

                await manager.broadcast({
                    "stream": stream,
                    "payload": payload
                })

                STREAMS[stream] = msg_id

        await asyncio.sleep(0.1)

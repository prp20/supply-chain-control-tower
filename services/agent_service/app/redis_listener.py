import json
import time
import redis
from app.state import BrainState

r = redis.Redis(host="redis", port=6379, decode_responses=True)

STREAMS = {
    "vehicle.events": "0",
    "route.status.updated": "0",
    "trip.delay.predicted": "0",
    "inventory.health.updated": "0",
    "inventory.replenishment.recommended": "0",
    "traffic.events": "0",
    "news.events": "0"
}

def listen(state: BrainState):
    print("👂 Master Brain listening to Redis streams")

    while True:
        events = r.xread(STREAMS, block=2000)

        for stream, messages in events:
            for msg_id, data in messages:
                payload = json.loads(data.get("payload", "{}"))

                state.add_event(stream, payload)
                print(f"📥 [{stream}] {payload}")

                STREAMS[stream] = msg_id

        time.sleep(0.2)

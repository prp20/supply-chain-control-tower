import redis
import json

r = redis.Redis(host="redis", port=6379, decode_responses=True)

STREAM_KEYS = [
    "vehicle.events",
    "traffic.events",
    "news.events",
    "trip.route.requested"
]

def consume_events(callback):
    # Start from beginning to avoid missing startup events
    streams = {key: "0" for key in STREAM_KEYS}

    print("📡 Route Planner listening to Redis streams")

    while True:
        events = r.xread(streams, block=0)
        for stream, messages in events:
            for msg_id, data in messages:
                try:
                    payload = json.loads(data["payload"])
                    callback(stream, payload)

                    # Advance offset for this stream
                    streams[stream] = msg_id

                except Exception as e:
                    print(f"❌ Error processing event from {stream}: {e}")

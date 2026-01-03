import redis
import json

r = redis.Redis(host="redis", port=6379, decode_responses=True)

STREAMS = {
    "vehicle.events": "$",
    "traffic.events": "$",
    "news.events": "$"
}

def consume_events(callback):
    while True:
        events = r.xread(STREAMS, block=0)
        for stream, messages in events:
            for _, data in messages:
                callback(stream, json.loads(data["payload"]))

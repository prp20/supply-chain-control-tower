import json
import asyncio
from app.redis_client import redis_client
from app.websocket_manager import ConnectionManager

STREAM_PREFIXES = [
    "vehicle.events.",
    "route.status.updated",
    "trip.delay.predicted"
]

stream_offsets = {}
client_subscriptions = {}

def discover_streams():
    streams = set()
    cursor = 0

    while True:
        cursor, keys = redis_client.scan(cursor=cursor, match="*", count=100)
        for key in keys:
            key = key.decode() if isinstance(key, bytes) else key
            if any(key.startswith(prefix) for prefix in STREAM_PREFIXES):
                streams.add(key)

        if cursor == 0:
            break

    return streams

def stream_matches_filter(stream, filter_pattern):
    """Check if a stream matches the client's subscription filter"""
    if not filter_pattern:
        return True
    # Support both exact match and wildcard patterns
    if filter_pattern.endswith("*"):
        return stream.startswith(filter_pattern[:-1])
    return stream == filter_pattern

async def redis_stream_listener(manager: ConnectionManager):
    print("👂 API Gateway listening to Redis streams")

    while True:
        # STEP 1: Discover new streams
        discovered = discover_streams()
        for stream in discovered:
            if stream not in stream_offsets:
                stream_offsets[stream] = "0"

        if not stream_offsets:
            await asyncio.sleep(1)
            continue

        # STEP 2: Read from all known streams
        events = redis_client.xread(stream_offsets, block=1000)

        for stream, messages in events:
            stream = stream.decode() if isinstance(stream, bytes) else stream

            for msg_id, data in messages:
                payload = json.loads(data.get("payload", "{}"))

                # Broadcast only to clients subscribed to this stream
                await manager.broadcast_filtered({
                    "stream": stream,
                    "payload": payload
                }, stream)

                stream_offsets[stream] = msg_id

        await asyncio.sleep(0.05)

import json
from typing import List, Dict, Set
from fastapi import WebSocket

class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []
        self.client_subscriptions: Dict[WebSocket, Set[str]] = {}

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)
        self.client_subscriptions[websocket] = set()
        print(f"✓ Client connected. Total connections: {len(self.active_connections)}")

    def disconnect(self, websocket: WebSocket):
        self.active_connections.remove(websocket)
        if websocket in self.client_subscriptions:
            del self.client_subscriptions[websocket]
        print(f"✓ Client disconnected. Total connections: {len(self.active_connections)}")

    async def handle_client_message(self, websocket: WebSocket, message: str):
        """Handle subscription/unsubscription messages from clients"""
        try:
            data = json.loads(message)
            action = data.get("action")
            stream = data.get("stream")

            if action == "subscribe" and stream:
                self.client_subscriptions[websocket].add(stream)
                print(f"📡 Client subscribed to: {stream}")
            elif action == "unsubscribe" and stream:
                self.client_subscriptions[websocket].discard(stream)
                print(f"📡 Client unsubscribed from: {stream}")
        except json.JSONDecodeError:
            print("Invalid message format")

    def stream_matches_filter(self, stream: str, filter_pattern: str) -> bool:
        """Check if stream matches the subscription filter"""
        if not filter_pattern:
            return True
        # Support wildcard patterns
        if filter_pattern.endswith("*"):
            return stream.startswith(filter_pattern[:-1])
        return stream == filter_pattern

    async def broadcast(self, message: dict):
        """Broadcast to all connected clients"""
        for connection in self.active_connections:
            try:
                await connection.send_json(message)
            except Exception as e:
                print(f"Error sending to client: {e}")

    async def broadcast_filtered(self, message: dict, stream: str):
        """Broadcast only to clients subscribed to this stream"""
        for connection, subscriptions in self.client_subscriptions.items():
            # Check if client is subscribed to this stream
            for subscription in subscriptions:
                if self.stream_matches_filter(stream, subscription):
                    try:
                        await connection.send_json(message)
                    except Exception as e:
                        print(f"Error sending to client: {e}")
                    break  # Don't send duplicate messages

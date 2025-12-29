import asyncio
import json
import redis.asyncio as redis
from fastapi import WebSocket
from typing import List, Dict, Set
from .settings import settings
from . import schemas
from .spam_filter import BLOCKED_WORDS

class ConnectionManager:
    def __init__(self):
        self.active_connections: Dict[int, Set[WebSocket]] = {}

    async def connect(self, websocket: WebSocket, room_id: int):
        await websocket.accept()
        if room_id not in self.active_connections:
            self.active_connections[room_id] = set()
        self.active_connections[room_id].add(websocket)

    def disconnect(self, websocket: WebSocket, room_id: int):
        if room_id in self.active_connections:
            self.active_connections[room_id].remove(websocket)
            if not self.active_connections[room_id]:
                del self.active_connections[room_id]

    async def broadcast_to_room(self, room_id: int, message: str):
        if room_id in self.active_connections:
            for connection in self.active_connections[room_id]:
                await connection.send_text(message)

class RedisManager:
    def __init__(self):
        self.redis_conn = redis.from_url(settings.REDIS_URL, decode_responses=True)

    async def publish_message(self, room_id: int, message: schemas.Message):
        channel = f"room:{room_id}"
        await self.redis_conn.publish(channel, json.dumps(message.dict(), default=str))

    async def subscribe_to_channel(self, room_id: int, connection_manager: ConnectionManager):
        channel = f"room:{room_id}"
        pubsub = self.redis_conn.pubsub()
        await pubsub.subscribe(channel)
        while True:
            message = await pubsub.get_message(ignore_subscribe_messages=True)
            if message:
                await connection_manager.broadcast_to_room(room_id, message['data'])
            await asyncio.sleep(0.01)

    async def add_active_user(self, room_id: int, user_id: int):
        await self.redis_conn.sadd(f"room:{room_id}:active_users", user_id)
        await self.redis_conn.sadd("global:active_users", user_id)

    async def remove_active_user(self, room_id: int, user_id: int):
        await self.redis_conn.srem(f"room:{room_id}:active_users", user_id)
        await self.redis_conn.srem("global:active_users", user_id)

    async def get_active_users_in_room(self, room_id: int) -> int:
        return await self.redis_conn.scard(f"room:{room_id}:active_users")

    async def get_total_active_users(self) -> int:
        return await self.redis_conn.scard("global:active_users")

connection_manager = ConnectionManager()
redis_manager = RedisManager()

async def is_spam(user_id: int, message_content: str) -> bool:
    """
    Checks if a message is spam based on keywords or rate limiting.
    Returns True if it's spam, False otherwise.
    """
    lower_content = message_content.lower()
    if any(word in lower_content for word in BLOCKED_WORDS):
        print(f"SPAM DETECTED: User {user_id} used a blocked keyword.")
        return True

    redis_conn = redis_manager.redis_conn
    rate_limit_key = f"rate_limit:user:{user_id}"
    current_count = await redis_conn.incr(rate_limit_key)
    if current_count == 1:
        await redis_conn.expire(rate_limit_key, 10)
    if current_count > 5:
        print(f"SPAM DETECTED: User {user_id} exceeded rate limit.")
        return True

    return False




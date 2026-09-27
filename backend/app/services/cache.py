"""Best-effort Redis cache used for short-lived market responses."""

from __future__ import annotations

import json
import logging
from typing import Any

from app.database import settings

logger = logging.getLogger(__name__)
_client = None
_disabled = False


def _get_client():
    global _client, _disabled
    if _disabled:
        return None
    if _client is None:
        try:
            import redis
            _client = redis.Redis.from_url(settings.REDIS_URL, decode_responses=True, socket_timeout=0.5)
        except Exception:
            _disabled = True
            return None
    return _client


def get_json(key: str) -> Any | None:
    client = _get_client()
    if client is None:
        return None
    try:
        value = client.get(f"finpilot:{key}")
        return json.loads(value) if value else None
    except Exception:
        return None


def set_json(key: str, value: Any, ttl_seconds: int) -> None:
    client = _get_client()
    if client is None:
        return
    try:
        client.setex(f"finpilot:{key}", ttl_seconds, json.dumps(value, default=str))
    except Exception:
        logger.debug("Redis unavailable; continuing with database cache", exc_info=True)
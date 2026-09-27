import asyncio
import logging

from fastapi import APIRouter, WebSocket, WebSocketDisconnect

from app.database import SessionLocal
from app.provider.market_depth import StoredMarketDepthProvider

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/v1/ws", tags=["streaming"])


@router.websocket("/market/{symbol}")
async def market_stream(websocket: WebSocket, symbol: str):
    await websocket.accept()
    try:
        while True:
            db = SessionLocal()
            try:
                payload = await StoredMarketDepthProvider(db).snapshot(symbol)
            except Exception as error:
                payload = {"symbol": symbol.upper(), "status": "error", "detail": str(error)}
            finally:
                db.close()
            await websocket.send_json(payload)
            await asyncio.sleep(5)
    except WebSocketDisconnect:
        logger.info("Market stream closed for %s", symbol)
# FinPilot API

FastAPI backend for AI Chat, AI Research, and the live market dashboard.

## Run

From the repository root, start the API and dependencies with:

```bash
docker compose up --build
```

The API listens on `http://localhost:8000`. Interactive endpoint documentation is at `/docs`. Configure `DATABASE_URL`, market provider keys, and optional LLM settings in `backend/.env`.

## Retained endpoints

- `POST /auth/register`, `POST /auth/token`, `GET /auth/me`: account access.
- `POST /api/v1/chat/conversations`, `GET /api/v1/chat/conversations`, `GET/DELETE /api/v1/chat/conversations/{id}`: user-owned saved chats.
- `POST /api/v1/chat/conversations/{id}/messages`: market chat or selected-document RAG chat; stores both turns and source citations.
- `GET/POST /api/v1/chat/documents`, `DELETE /api/v1/chat/documents/{id}`: private PDF/text upload, indexing, listing, and deletion.
- `POST /api/v1/ai/query`: AI research query with answer and evidence.
- `POST /api/v1/ai/evidence`: market evidence for a research question.
- `GET /api/v1/ai/evaluations/routing`: routing evaluation utility.
- `/api/v1/market/*`: market status, indices, quotes, movers, sectors, historical data, search, forex, commodities, and dashboard signals.
- `GET /health/live`, `GET /health/ready`: service health.

The AI service uses stored and fetched market data for its evidence. When no LLM API key is configured, it returns a deterministic answer from that evidence.

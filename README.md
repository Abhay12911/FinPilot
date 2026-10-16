# FinPilot

FinPilot is focused on three product areas: AI Chat, AI Research, and a live market data dashboard.

## Run locally

Start the API and its PostgreSQL/Redis dependencies:

```bash
docker compose up --build
```

In another terminal, start the React app:

```bash
cd finpilot-frontend
npm install
npm run dev
```

The API is available at `http://localhost:8000`; the frontend is served by Vite. Set market provider and AI credentials in `backend/.env` as needed. The dashboard can use its market-data fallbacks when external provider credentials are unavailable; AI answers use deterministic market evidence when no LLM key is configured.

## Product areas

- **AI Chat** answers market questions, analyzes uploaded PDF/text/CSV/Markdown/JSON documents with retrieved source citations, and saves conversations for later.
- **AI Research** runs a focused research question through the same market-grounded AI service.
- **Live Market Dashboard** shows market status, indices, movers, sectors, history, forex, commodities, and signals.

## Project structure

- `finpilot-frontend/src/Pages`: the three product screens, authentication pages, and dashboard shell.
- `backend/app/ai`: evidence routing, market tools, AI provider integration, and routing evaluation.
- `backend/app/api/v1/market.py`: live dashboard market endpoints.
- `backend/app/routers/chat.py`, `backend/app/services/rag.py`, and `backend/app/models/conversation.py`: authenticated chat, private document retrieval, source citations, and persistent chat memory.
- `backend/app/services` and `backend/app/provider`: market retrieval and financial calculations used by the retained features.

The API docs are available at `http://localhost:8000/docs` while the backend is running.

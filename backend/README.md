# FinPilot Backend

> FastAPI Python backend for the FinPilot AI financial intelligence platform.

---

## Stack

| Library | Version | Purpose |
|---------|---------|---------|
| FastAPI | 0.141 | API framework |
| Uvicorn | 0.52 | ASGI server |
| SQLAlchemy | 2.0 | ORM |
| SQLite | built-in | Development database |
| python-jose | 3.5 | JWT token signing/verification |
| pwdlib (argon2) | 0.3 | Password hashing |
| pydantic-settings | 2.15 | `.env` config management |
| python-multipart | 0.0.32 | Form data parsing (OAuth2 login) |
| pydantic[email] | 2.13 | Email validation |

---

## Setup

### 1. Create virtual environment

```bash
# Windows
python -m venv venv
venv\Scripts\activate

# macOS / Linux
python -m venv venv
source venv/bin/activate
```

### 2. Install dependencies

```bash
pip install fastapi uvicorn sqlalchemy "python-jose[cryptography]" \
            "pwdlib[argon2]" "pydantic[email]" pydantic-settings \
            python-multipart
```

Or use the requirements file:

```bash
pip install -r requirements.txt
```

The default database is SQLite, so the API can start without Docker. To use the
included PostgreSQL container instead, start it from the repository root and set
the following in `backend/.env`:

```env
DATABASE_URL=postgresql://finpilot:postgres@localhost:5432/finpilot
REDIS_URL=redis://localhost:6379
```

After the API is running, load the initial NSE universe and one year of daily
bars with:

```bash
python -m scripts.seed_market
```

For the complete containerized stack, from the repository root run:

```bash
docker compose up --build
```

The API is then available at `http://localhost:8000`, with liveness at
`/health/live` and readiness at `/health/ready`.

### 3. Configure environment

```bash
cp .env.example .env
# Edit .env and set a strong SECRET_KEY
```

### 4. Start the server

```bash
# Development (auto-reload)
uvicorn app.main:app --reload --port 8000

# Production
uvicorn app.main:app --host 0.0.0.0 --port 8000 --workers 4
```

API available at: **http://127.0.0.1:8000**  
Swagger UI: **http://127.0.0.1:8000/docs**  
ReDoc: **http://127.0.0.1:8000/redoc**

---

## Project Structure

```
backend/
├── .env                    # Environment config (git-ignored)
├── .env.example            # Template for .env
├── finpilot.db             # SQLite database (auto-created on startup)
├── requirements.txt        # Python dependencies
└── app/
    ├── __init__.py
    ├── main.py             # FastAPI app, CORS, router registration, table creation
    ├── database.py         # SQLAlchemy engine, SessionLocal, Base, Settings
    ├── auth.py             # JWT auth: /register, /token, /me
    ├── models/
    │   ├── user.py         # User (id, email, password_hash)
    │   ├── portfolio.py    # Holding, WatchlistItem
    │   └── research.py     # Report, Document
    └── routers/
        ├── portfolio.py    # /portfolio/* CRUD endpoints
        ├── companies.py    # /companies/* data endpoints
        └── research.py     # /research/* AI report endpoints
```

---

## Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `DATABASE_URL` | Yes | `sqlite:///./finpilot.db` | SQLAlchemy database connection string |
| `SECRET_KEY` | Yes | (insecure default) | JWT signing secret — **change in production** |
| `TWELVE_DATA_KEY` | No | — | Optional Twelve Data key for search, movers, and sector data. Index and chart data use Yahoo Finance without a key. |

### `.env.example`

```env
DATABASE_URL=sqlite:///./finpilot.db
SECRET_KEY=CHANGE_THIS_TO_A_RANDOM_64_CHAR_SECRET
```

---

## API Endpoints

### Market foundation (`/api/v1`)

The first market-data slice is available without authentication:

```text
GET  /stocks/search?q=reliance
GET  /stocks/RELIANCE/quote
GET  /stocks/RELIANCE/history
GET  /market/gainers
GET  /market/losers
GET  /market/52-week-high
GET  /market/52-week-low
GET  /market/most-volume
GET  /market/leaders
GET  /market/laggards
GET  /stocks/RELIANCE/indicators
GET  /stocks/RELIANCE/attribution
POST /chat
POST /ai/query
POST /ai/evidence
```

Market facts are calculated by the stock service and scanner from stored price
bars. The AI endpoint uses the Responses API tool-calling loop when
`OPENAI_API_KEY` is configured; it does not invent quote or history values.

`POST /api/v1/chat` and `POST /api/v1/ai/query` work without an LLM key using
deterministic local answers. To enable model synthesis, put the provider key and
model in `backend/.env`:

```env
OPENAI_API_KEY=your-key-here
OPENAI_MODEL=your-supported-model
```

The provider boundary is [providers.py](app/ai/providers.py); add another LLM
there when you need Gemini, Anthropic, or a self-hosted model.

### Free LLM setup

The recommended free-compatible option is OpenRouter. Create an OpenRouter key
and choose a model marked `:free`, then set:

```env
LLM_PROVIDER=openrouter
LLM_API_KEY=your-openrouter-key
LLM_BASE_URL=https://openrouter.ai/api/v1
LLM_MODEL=meta-llama/llama-3.3-8b-instruct:free
```

Groq works through the same adapter:

```env
LLM_PROVIDER=groq
LLM_API_KEY=your-groq-key
LLM_BASE_URL=https://api.groq.com/openai/v1
LLM_MODEL=llama-3.1-8b-instant
```

For a local Ollama model, no cloud key is needed:

```env
LLM_PROVIDER=ollama
LLM_API_KEY=ollama
LLM_BASE_URL=http://localhost:11434/v1
LLM_MODEL=llama3.1:8b
```

Free chat providers commonly do not provide embeddings. The RAG system still
works with hybrid lexical retrieval. For semantic embeddings, configure a
separate compatible embedding service:

```env
EMBEDDING_API_KEY=your-embedding-key
EMBEDDING_BASE_URL=https://api.openai.com/v1
EMBEDDING_MODEL=text-embedding-3-small
```

Hugging Face embeddings are supported directly as well:

```env
EMBEDDING_PROVIDER=huggingface
HF_API_KEY=your-huggingface-read-token
HF_EMBEDDING_MODEL=sentence-transformers/all-MiniLM-L6-v2
HF_EMBEDDING_URL=https://router.huggingface.co/hf-inference/models
```

Technical indicators are calculated server-side from persisted OHLCV bars. The
attribution response separates measured price/volume/volatility facts from
cached news and labels news as correlation-only evidence. Authenticated
`/research/documents` routes support UTF-8 text upload, chunking, keyword
retrieval, listing, and deletion; pgvector embeddings can be added behind this
boundary later.

### Auth (`/auth`)

| Method | Path | Body | Auth | Description |
|--------|------|------|------|-------------|
| `POST` | `/auth/register` | `{ email, password }` | No | Create new account |
| `POST` | `/auth/token` | `username=...&password=...` (form) | No | Login → JWT |
| `GET` | `/auth/me` | — | Bearer | Current user info |

> **Note:** `/auth/token` uses `application/x-www-form-urlencoded` (FastAPI OAuth2 standard). The frontend sends `username` (= email) + `password`.

### Portfolio (`/portfolio`)

All endpoints require `Authorization: Bearer <token>`.

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/portfolio/summary` | Portfolio value, today's change, risk score |
| `GET` | `/portfolio/holdings` | All holdings with P&L |
| `POST` | `/portfolio/holdings` | Add a holding |
| `DELETE` | `/portfolio/holdings/{id}` | Remove a holding |
| `GET` | `/portfolio/watchlist` | Watchlist items |
| `POST` | `/portfolio/watchlist` | Add ticker to watchlist |
| `DELETE` | `/portfolio/watchlist/{ticker}` | Remove from watchlist |
| `GET` | `/portfolio/performance` | 30-day portfolio value time series |

### Companies (`/companies`)

All endpoints require `Authorization: Bearer <token>`.

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/companies/{ticker}` | Full company details (price, metrics, financials, AI summary) |
| `GET` | `/companies/{ticker}/news` | Recent news with sentiment |
| `GET` | `/companies/search?q={query}` | Search company by name or ticker |
| `GET` | `/companies/market/signals` | AI market signals across watchlist |
| `GET` | `/companies/market/overview` | Index data (S&P 500, NASDAQ, etc.) |
| `GET` | `/companies/market/news` | Curated market news feed |

### Research (`/research`)

All endpoints require `Authorization: Bearer <token>`.

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/research/reports` | All saved AI reports for user |
| `POST` | `/research/reports` | Save a new AI research report |
| `DELETE` | `/research/reports/{id}` | Delete a report |
| `GET` | `/research/documents` | Uploaded documents |
| `POST` | `/research/documents` | Upload a document |
| `DELETE` | `/research/documents/{id}` | Delete a document |

---

## Database Models

### `users`
| Column | Type | Description |
|--------|------|-------------|
| `id` | Integer PK | Auto-increment |
| `email` | String UNIQUE | User email address |
| `password_hash` | String | Argon2 hashed password |

### `holdings`
| Column | Type | Description |
|--------|------|-------------|
| `id` | Integer PK | Auto-increment |
| `user_id` | Integer FK | Owner |
| `ticker` | String | Stock ticker symbol |
| `name` | String | Company name |
| `shares` | Float | Number of shares |
| `avg_cost` | Float | Average cost basis per share |
| `current_price` | Float | Latest price (updated via data feed) |

### `watchlist_items`
| Column | Type | Description |
|--------|------|-------------|
| `id` | Integer PK | Auto-increment |
| `user_id` | Integer FK | Owner |
| `ticker` | String | Stock ticker symbol |
| `name` | String | Company name |

### `reports`
| Column | Type | Description |
|--------|------|-------------|
| `id` | Integer PK | Auto-increment |
| `user_id` | Integer FK | Owner |
| `company` | String | Researched company |
| `ticker` | String | Ticker symbol |
| `content` | Text | Full report JSON/markdown |
| `created_at` | DateTime | Timestamp |

---

## CORS Configuration

The backend is configured to accept requests from the Vite dev server:

```python
allow_origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
]
```

For production, update `main.py` to allow your deployed frontend domain.

---

## Security Notes

| Item | Current | Production Recommendation |
|------|---------|--------------------------|
| Password hashing | Argon2 (pwdlib) | ✅ Secure |
| JWT algorithm | HS256 | Consider RS256 for distributed systems |
| JWT expiry | 30 minutes | ✅ Reasonable — add refresh token |
| Secret key | `.env` | Use a secrets manager (AWS Secrets Manager / Vault) |
| Database | SQLite | Migrate to PostgreSQL |
| HTTPS | None (dev) | Required in production (TLS termination at proxy) |

---

## Roadmap

### Phase 2 — Real Data
- [ ] Integrate Alpha Vantage or Polygon.io for live price data
- [ ] WebSocket endpoint for real-time price streaming
- [ ] Scheduled job to update `current_price` in holdings

### Phase 3 — AI
- [ ] Gemini API integration for `/research/chat` endpoint
- [ ] Google Search grounding for deep research
- [ ] News sentiment scoring via NLP

### Phase 4 — Production
- [ ] PostgreSQL migration (`DATABASE_URL=postgresql://...`)
- [ ] Alembic database migrations
- [ ] JWT refresh token endpoint
- [ ] Rate limiting middleware
- [ ] Docker + docker-compose setup
- [ ] CI/CD pipeline (GitHub Actions)

# FinPilot Architecture and Data Flow

## 1. Purpose

FinPilot is a React financial intelligence application backed by a FastAPI service. It combines:

- Live and cached market data.
- Indian stock discovery by ticker, company name, and common spelling mistakes.
- Deterministic market calculations.
- AI-assisted financial explanations.
- Document upload, extraction, chunking, embeddings, and evidence retrieval.
- Portfolio, watchlist, company workspace, market news, reports, and streaming views.

This document describes the implementation currently present in the repository.

## 2. High-level architecture

```mermaid
flowchart LR
    Browser[React + Vite frontend] -->|HTTP JSON / WebSocket| API[FastAPI API]
    API --> Auth[JWT authentication]
    API --> Services[Domain services]
    Services --> PG[(PostgreSQL + pgvector)]
    Services --> Redis[(Redis optional cache)]
    Services --> Twelve[Twelve Data]
    Services --> Yahoo[Yahoo Finance]
    Services --> Alpha[Alpha Vantage news]
    Services --> Groq[Groq OpenAI-compatible LLM]
    Services --> HF[Hugging Face embeddings]
```

### Runtime components

| Component | Location | Responsibility |
|---|---|---|
| Frontend | `finpilot-frontend/` | React pages, routing, forms, charts, API calls, authentication state |
| API | `backend/app/` | FastAPI routes, authentication, orchestration, providers, services |
| Database | Docker PostgreSQL | Users, portfolios, stocks, price bars, quotes, cache, reports, documents, news |
| Vector database / vector store | PostgreSQL with the `pgvector` extension, provided by the `pgvector/pgvector:pg17` image | Stores and searches document embeddings through LangChain PGVector |
| Cache | Docker Redis | Short-lived JSON market-response cache; optional and best effort |
| LLM | Groq through OpenAI SDK | Natural-language synthesis using `openai/gpt-oss-20b` in the current environment |
| Market quote/history provider | Twelve Data | Dashboard indices, quotes, history, market status, movers-related data, search |
| Indian equity discovery/history provider | Yahoo Finance | Dynamic NSE/BSE company lookup and on-demand historical bars |
| Official NSE market-wide ranking provider | NSE UDiFF Common Bhavcopy Final | Daily NSE EQ-series gainers, losers, movers, and rupee-change rankings |
| News provider | Alpha Vantage | News sentiment and company/news feeds when configured |
| Embeddings provider | Hugging Face | Optional document embeddings using `sentence-transformers/all-MiniLM-L6-v2` |

## 3. Starting the system

From the repository root:

```powershell
docker compose up -d --build
docker compose exec api python -m scripts.seed_market
```

The first command starts or rebuilds:

- `api` on `http://localhost:8000`
- `postgres` on port `5432`
- `redis` on port `6379`

The seed command loads the initial NSE universe and approximately one year of Yahoo daily bars for the stocks listed in `backend/scripts/seed_market.py`.

The system does not depend only on that seed list for research. If a user requests another Indian company, the research resolver searches Yahoo Finance and stores the discovered stock and its history in PostgreSQL.

Health endpoints:

```text
GET /health/live
GET /health/ready
GET /
```

## 4. Configuration

Configuration is loaded by `backend/app/database.py` using Pydantic Settings and `backend/.env`.

### Database and infrastructure

| Variable | Current purpose |
|---|---|
| `DATABASE_URL` | PostgreSQL connection in Docker; SQLite is the default fallback for local development |
| `REDIS_URL` | Redis connection used by the short-lived cache |
| `SECRET_KEY` | JWT signing secret; it must be kept private and changed outside development |

Docker overrides the database and Redis connection strings so the API connects to the service names `postgres` and `redis` inside the compose network.

### Market-data keys

| Variable | Provider/use |
|---|---|
| `TWELVE_DATA_KEY` | Twelve Data quotes, history, status, search, indices, forex, commodities |
| `ALPHA_VANTAGE_KEY` | Alpha Vantage news sentiment and company overview |

Yahoo Finance access is implemented through public HTTP endpoints and does not use a configured key.

### AI and embeddings

| Variable | Current purpose |
|---|---|
| `LLM_PROVIDER` | Current value is `groq` |
| `LLM_API_KEY` | Groq key used by the OpenAI-compatible client |
| `LLM_BASE_URL` | Current value is `https://api.groq.com/openai/v1` |
| `LLM_MODEL` | Current value is `openai/gpt-oss-20b` |
| `OPENAI_API_KEY`, `OPENAI_MODEL` | Fallback OpenAI-compatible configuration |
| `EMBEDDING_PROVIDER` | Current value is `huggingface` |
| `HF_API_KEY` | Hugging Face embedding authorization |
| `HF_EMBEDDING_MODEL` | Current sentence-transformer model |
| `HF_EMBEDDING_URL` | Hugging Face inference endpoint base |
| `EMBEDDING_API_KEY`, `EMBEDDING_BASE_URL`, `EMBEDDING_MODEL` | Optional OpenAI-compatible embedding configuration |

Actual keys and secrets must never be committed to documentation, frontend code, logs, or source control. The frontend does not receive provider keys.

## 5. Backend application structure

### Application startup

`backend/app/main.py`:

1. Imports all SQLAlchemy models.
2. Creates missing tables with `Base.metadata.create_all`.
3. Adds compatibility columns for document metadata and embeddings.
4. Creates the FastAPI application.
5. Enables CORS for the local Vite ports 5173 and 5174.
6. Adds request observability middleware.
7. Registers authentication, portfolio, company, research, market, news, stock, chat, AI, and WebSocket routers.

### Main backend modules

| Path | Role |
|---|---|
| `app/database.py` | Settings, SQLAlchemy engine, sessions, declarative base |
| `app/auth.py` | Password authentication, JWT tokens, current-user dependency |
| `app/observability.py` | Request context/observability middleware |
| `app/models/` | SQLAlchemy persistence models |
| `app/schemas/` | Pydantic response/request schemas |
| `app/routers/` | Feature-specific HTTP routes |
| `app/api/v1/market.py` | Market overview API routes |
| `app/provider/` | External provider adapters and provider contracts |
| `app/services/` | Business logic, caching, analytics, retrieval, scanning |
| `app/ai/` | AI tools, LLM orchestration, routing, evaluation |
| `scripts/seed_market.py` | Initial stock and daily-bar loading |

## 6. Live market data for the Overview page

### Request path

```mermaid
sequenceDiagram
    participant UI as Overview/Market pages
    participant API as FastAPI market route
    participant S as market_service
    participant R as Redis
    participant DB as PostgreSQL
    participant TD as Twelve Data
    participant YF as Yahoo Finance

    UI->>API: GET /api/v1/market/indices or quote/history
    API->>S: Resolve requested market data
    S->>R: Read short-lived JSON cache
    alt Redis hit
        R-->>S: Cached response
    else Cache miss
        S->>DB: Read recent MarketQuote/MarketCache
        alt Fresh database value
            DB-->>S: Cached quote/history
        else Provider request
            S->>TD: Request quote, history, status, or search
            TD-->>S: Provider response
            S->>DB: Persist MarketQuote/MarketCache
            S->>R: Store short-lived response
        end
    end
    S-->>API: Normalized response
    API-->>UI: JSON response
    Note over S,YF: Yahoo is used for dynamic Indian equity discovery/history in research and for supported index fallback paths.
```

### Market service behavior

`backend/app/services/market_service.py` is the main Overview data service.

It provides:

- Exchange status.
- India, USA, and global indices.
- Individual quotes.
- Historical series.
- Movers: gainers, losers, most active.
- Sector performance.
- Symbol search.
- Forex.
- Commodities.
- Market signals.

### Cache layers

There are two cache layers:

1. **Redis:** `backend/app/services/cache.py` stores JSON under the `finpilot:` prefix using TTLs. Redis failures are ignored so the API can continue.
2. **PostgreSQL:** `MarketCache` stores serialized JSON, and `MarketQuote` stores normalized quote fields. PostgreSQL is used as a fallback when Redis is unavailable and for persistence between API processes.

Configured service TTLs include:

- Quotes: 5 minutes.
- Historical data: 60 minutes.
- Market status: 15 minutes.

### Twelve Data normalization

`backend/app/provider/twelve_data.py` calls:

- `/quote`
- `/time_series`
- `/market_state`
- `/symbol_search`

It normalizes FinPilot symbols such as `NIFTY50`, `BANKNIFTY`, `SENSEX`, `SPX`, `COMP`, `DJI`, `USDINR`, `GOLD`, and `CRUDE` to Twelve Data symbols.

### Fallback values

`market_service.py` contains defined fallback values for common indices, currencies, and commodities. These values allow screens to remain populated when a provider is unavailable, but they are fallback/demo values and must not be interpreted as a fresh provider quote.

For stored-stock scanners, `MarketScanner` calculates metrics from PostgreSQL `PriceBar` rows rather than calling an external API for every ranking request.

## 7. Indian stock lookup and company research

### Supported inputs

Research accepts:

- NSE ticker: `RELIANCE`, `CANBK`.
- Yahoo symbol: `RELIANCE.NS`, `CANBK.NS`.
- Company name: `Canara Bank`, `Reliance Industries`.
- Natural-language question: `Give more details about Canara Bank`.
- Common spelling mistakes: `Relaince` can resolve to Reliance through prefix probing and result scoring.

### Resolution flow

`backend/app/ai/orchestration.py` performs the following:

1. Checks the supplied current symbol/context against locally stored stocks.
2. Checks whether the message contains a locally known ticker or company name.
3. Extracts likely company phrases after words such as `for`, `about`, `on`, and `of`.
4. Extracts individual words and short prefixes for typo tolerance.
5. Calls Yahoo Finance `/v1/finance/search`.
6. Keeps NSE `.NS` and BSE `.BO` equity results.
7. Scores candidates using similarity between the query, company name, and symbol.
8. Selects the most probable candidate.
9. Creates a `Stock` record if the candidate is new.
10. Calls Yahoo Finance chart history for daily bars.
11. Stores the returned OHLCV rows in `PriceBar`.
12. Sends the resolved ticker to the existing deterministic tools and AI synthesis layer.

This is why the app is not restricted to the ten stocks loaded by `seed_market.py`.

### Research evidence

The routing function classifies questions as:

- `documents`: document, filing, report, management, transcript.
- `attribution`: why, move, fell, rose, dropped, jumped.
- `technical_analysis`: RSI, MACD, overbought, oversold, technical.
- `market_data`: default route, including prices, highs, lows, and history.

The evidence builder then calls deterministic services:

- `get_stock_quote`
- `get_stock_history`
- `get_52_week_data`
- `get_technical_indicators`
- `get_stock_move_attribution`
- `retrieve_document_evidence`

The evidence is serialized and passed to the AI only after the market facts have been obtained.

## 8. Chat response flow

### Frontend

`finpilot-frontend/src/Pages/ChatBot.jsx` collects the user message and calls:

```text
POST /api/v1/chat
{
  "message": "Give more details about Canara Bank",
  "current_symbol": "canara bank"
}
```

The client implementation is in `src/services/finpilotApi.js`.

### Backend

`backend/app/routers/chat.py` calls `answer_query`.

The response includes:

- `answer`: rendered natural-language result.
- `route`: selected evidence route.
- `citations`: market or document references.
- `provider`: configured LLM name or `deterministic` fallback.

### AI synthesis

`backend/app/ai/agent.py` uses the OpenAI Python SDK with the configured base URL. This allows Groq to be used through its OpenAI-compatible API.

The AI instructions require it to:

- Use supplied evidence.
- Avoid inventing live values.
- Separate facts from interpretation.
- Avoid claiming correlation proves causation.

The code supports function tools for quotes, history, 52-week data, technical indicators, move attribution, and documents.

When verified evidence is already available, the system sends the evidence to the model for synthesis without exposing a second opportunity for the model to guess another ticker or call an unsupported browser tool.

If the provider fails, emits an unsupported tool call, returns an empty response, or cannot be reached, `answer_query` returns a deterministic answer from the verified evidence instead of propagating an AI error to the user.

## 9. AI Research report flow

The AI Research page is `finpilot-frontend/src/Pages/AIResearch.jsx`.

1. User enters a company, ticker, objective, period, and optional report sections.
2. Editing the company clears the ticker; editing the ticker clears the company. This prevents the default Reliance value from overriding a newly entered stock.
3. `src/services/research.js` sends `POST /research/reports` with the company, ticker, and question.
4. `backend/app/routers/research.py` chooses the user-provided lookup context.
5. `answer_query` resolves the stock and builds evidence.
6. AI synthesis or deterministic fallback generates the report content.
7. The backend extracts the resolved ticker from the evidence.
8. A `Report` record is saved for the authenticated user.
9. The frontend displays the returned report content in its report sections.

The animated research agents in the UI represent workflow stages. The backend currently performs the actual evidence collection and synthesis in the shared orchestration path; the visual agent steps are presentation state rather than separate backend worker processes.

## 10. Document research and RAG

Documents are handled by `backend/app/services/rag.py` and research document routes.

### Upload and indexing

1. User uploads a supported PDF, TXT, Markdown, CSV, JSON, or LOG file.
2. The backend extracts text using `pypdf` for PDFs or UTF-8 decoding for text formats.
3. Whitespace is normalized.
4. Text is split into chunks of approximately 1,600 characters with 240-character overlap.
5. Optional Hugging Face embeddings are generated.
6. The document is marked `Indexed`.
7. Chunks, character counts, and serialized embeddings are stored in `DocumentChunk`.

### Retrieval

Retrieval combines:

- Lexical term overlap.
- Optional cosine similarity of embeddings.

When an embedding exists, the score is:

```text
0.55 * lexical_score + 0.45 * vector_score
```

Without embeddings, lexical retrieval is used. Results include document ID, filename, chunk number, text, score, lexical score, vector score, and citation metadata.

## 11. News and attribution

`backend/app/provider/alpha_vantage.py` calls Alpha Vantage `NEWS_SENTIMENT` and normalizes:

- Title.
- URL.
- Source.
- Author.
- Summary.
- Topic.
- Ticker.
- Sentiment label and score.
- Publication time.

`backend/app/services/price_attribution.py` builds a measured evidence pack containing:

- Observed price return.
- Current close.
- Volume compared with the prior 20-session average.
- Recent daily-return volatility.
- Cached related news.
- A disclaimer that news is correlation evidence only.

The news router exposes paginated news, topics, and aggregate sentiment endpoints.

## 12. Database model overview

The main SQLAlchemy models are:

| Model | Stored data |
|---|---|
| `User` | Authenticated account information |
| `Holding` | Portfolio positions |
| `WatchlistItem` | User watchlist symbols |
| `Stock` | Ticker, exchange symbol, company name, exchange, sector |
| `PriceBar` | Daily/intraday OHLCV history |
| `MarketQuote` | Normalized cached quotes |
| `MarketCache` | Serialized service responses |
| `NewsArticle` | Cached news and sentiment |
| `Document` | Uploaded document metadata and extracted text |
| `DocumentChunk` | Chunk text, count, optional embedding |
| `Report` | User-generated AI research reports |

PostgreSQL is the Docker production-style database. SQLite remains supported by the settings default for lightweight local development.

## 13. API surface

### Authentication and users

Routes are defined in `backend/app/auth.py` and provide registration, login, and current-user authentication used by protected features.

### Market

Prefix: `/api/v1/market`

- `/status`
- `/indices`
- `/quote/{symbol}`
- `/history/{symbol}`
- `/search`
- `/movers`
- `/sectors`
- `/forex`
- `/commodities`
- `/signals`
- `/gainers`
- `/losers`
- `/most-volume`
- `/leaders`
- `/laggards`
- `/52-week-high`
- `/52-week-low`

### Stocks

Prefix: `/api/v1/stocks`

- `/search`
- `/{symbol}/quote`
- `/{symbol}/history`
- `/{symbol}/indicators`
- `/{symbol}/attribution`

### Chat and AI

- `POST /api/v1/chat`
- `POST /api/v1/ai/query`
- `POST /api/v1/ai/evidence`
- `GET /api/v1/ai/evaluations/routing`

### Research

Prefix: `/research`

- `GET /reports`
- `POST /reports`
- `DELETE /reports/{report_id}`
- `POST /chat`
- `GET /documents`
- `POST /documents`
- Document delete and retrieval routes defined in `research.py`

### News

Prefix: `/api/v1/news`

- `GET /`
- `GET /topics`
- `GET /sentiment`

### Streaming

WebSocket:

```text
/ws: /api/v1/ws/market/{symbol}
```

The current streaming provider is `StoredMarketDepthProvider`. It sends a snapshot every five seconds using stored quote data. The order book is intentionally empty until a broker/depth provider is configured.

## 14. Frontend architecture

The frontend uses:

- React 19.
- Vite 6.
- React Router.
- Tailwind CSS 4 and Tailwind Vite integration.
- Framer Motion for transitions and scroll progress.
- Recharts for charts.
- Lucide React for icons.
- `@react-oauth/google` for Google OAuth-related UI/integration.
- `clsx` and `tailwind-merge` for class composition.

The main protected routes are:

- `/dashboard`
- `/dashboard/market-overview`
- `/dashboard/market-signals`
- `/dashboard/companies`
- `/dashboard/companies/:ticker`
- `/dashboard/research`
- `/dashboard/ai-research`
- `/dashboard/compare`
- `/dashboard/portfolio`
- `/dashboard/watchlist`
- `/dashboard/personal-analyzer`
- `/dashboard/market-news`
- `/dashboard/documents`
- `/dashboard/reports`
- `/dashboard/brokers`

The frontend API base URL is read from `VITE_API_URL`; otherwise it defaults to `http://localhost:8000/api/v1` or the feature service's configured local API base.

## 15. Error handling and fallback strategy

FinPilot is designed to continue operating when optional providers fail:

- Redis failure falls back to PostgreSQL or a fresh provider request.
- Twelve Data failure can use stored values or defined fallback values.
- Yahoo search/history failure leaves the user with a deterministic no-data message rather than an empty response.
- Groq/LLM failure falls back to deterministic evidence formatting.
- Missing embeddings fall back to lexical document retrieval.
- Alpha Vantage rate limits return cached/empty news rather than breaking the market page.
- The market-depth stream reports provider status and continues sending snapshots.

Fallback data is not the same as live provider data. The UI/API should retain source and provider labels when presenting it.

## 16. Security boundaries

- Provider keys remain backend-only.
- Frontend requests use authentication tokens where required.
- CORS is restricted to configured local development origins.
- User document retrieval is filtered by `user_id`.
- Reports and documents are associated with authenticated users.
- SQLAlchemy parameterization is used for database access.
- Secrets in `.env` should be rotated if they have ever been exposed or committed.

## 17. Validation and operations

Useful commands:

```powershell
# Start and rebuild services
docker compose up -d --build

# Load initial market data
docker compose exec api python -m scripts.seed_market

# Check services
docker compose ps

# Check API logs
docker compose logs api --tail 100

# Backend syntax check
cd backend
.\venv\Scripts\python.exe -m compileall -q app

# Frontend production build
cd ..\finpilot-frontend
npm run build
```

## 18. Important implementation limitations

1. The seeded market scanner only ranks stocks with enough stored daily bars. Dynamically discovered stocks become available to research after Yahoo history is loaded, but they are not automatically part of every precomputed mover list until enough local bars exist.
2. The dashboard's fallback index values are defined application values and may be stale when providers are unavailable.
3. Yahoo Finance is used without a key and can change response behavior or rate-limit requests.
4. Alpha Vantage free-tier quotas can limit news freshness.
5. The current WebSocket market-depth provider returns an empty order book because no broker feed is configured.
6. The AI model is a synthesis layer, not the source of truth. Market facts come from deterministic provider/database tools first.
7. The visual multi-agent progress display in AI Research is a frontend workflow presentation; the backend uses a shared orchestration service rather than independent agent workers.
8. `pytest` is not part of the current backend requirements file, so backend validation currently relies on compilation, API checks, and Docker health checks unless a test dependency is installed separately.

## 19. Source-of-truth summary

For live dashboard cards, start at:

```text
frontend page -> frontend market service -> /api/v1/market/* -> market_service.py -> Twelve Data/Redis/PostgreSQL/fallback
```

For chat:

```text
ChatBot.jsx -> finpilotApi.js -> /api/v1/chat -> answer_query -> stock resolver/evidence -> ask_finpilot or deterministic fallback
```

For AI Research:

```text
AIResearch.jsx -> research.js -> /research/reports -> answer_query -> Yahoo discovery/history -> evidence -> Groq synthesis or deterministic report -> Report database row
```

For document research:

```text
upload -> extract -> normalize -> chunk -> Hugging Face embedding (optional) -> PostgreSQL -> hybrid lexical/vector retrieval -> AI evidence synthesis
```

## 20. Execution-level workflow details

This section describes the order of operations, the data passed between steps, and the behavior when a step fails.

### 20.1 Docker startup sequence

When `docker compose up -d --build` is executed:

1. Docker reads `docker-compose.yml`.
2. The `api` image is built from `backend/Dockerfile`.
3. The API image starts from `python:3.12-slim`.
4. `backend/requirements.txt` is copied into the image.
5. Python dependencies are installed with `pip`.
6. `backend/app` and `backend/scripts` are copied into `/app`.
7. PostgreSQL starts from `pgvector/pgvector:pg17`.
8. Redis starts from `redis:7-alpine`.
9. PostgreSQL must pass `pg_isready -U finpilot -d finpilot` before the API is started.
10. Redis must answer `PING` before the API is started.
11. Compose injects the Docker-internal values:
    - `DATABASE_URL=postgresql://finpilot:postgres@postgres:5432/finpilot`
    - `REDIS_URL=redis://redis:6379`
12. Uvicorn starts `app.main:app` on `0.0.0.0:8000`.
13. FastAPI imports all models before table creation.
14. SQLAlchemy creates missing tables.
15. The document compatibility migration checks for missing metadata columns and adds them.
16. The API becomes healthy when `/health/ready` can execute `SELECT 1`.

The separate seed command then:

1. Opens a SQLAlchemy session.
2. Iterates through the fixed initial NSE universe.
3. Creates a `Stock` row when a ticker does not exist.
4. Calls Yahoo Finance for approximately 252 daily bars.
5. Deletes old bars for that stock.
6. Converts each returned row into a `PriceBar`.
7. Commits all rows.

If Yahoo returns no history for one symbol, that symbol is reported and its existing bars are preserved. If the seed process raises another exception, the transaction is rolled back.

### 20.2 Overview quote execution

For `GET /api/v1/market/quote/{symbol}`:

1. FastAPI validates the path and creates a database session.
2. `market_service.get_quote` checks `MarketQuote` for a record newer than five minutes.
3. A fresh database quote is returned immediately.
4. If no fresh quote exists, the service requests Yahoo Finance first.
5. Yahoo's chart response is parsed into:
   - Symbol.
   - Display name.
   - Price.
   - Previous close.
   - Absolute change.
   - Percentage change.
   - Currency.
   - Exchange.
   - Provider timestamp.
6. A successful Yahoo quote is normalized and saved to `MarketQuote`.
7. If Yahoo fails and a Twelve Data key exists, Twelve Data `/quote` is called.
8. A successful Twelve Data response is normalized and saved.
9. If both providers fail, an old `MarketQuote` is returned if one exists.
10. If no old quote exists, the endpoint returns `404`.
11. The database session is closed after the request.

The indices endpoint follows a similar path but first checks all requested symbols, fetches missing symbols in a Yahoo batch, then uses a Twelve Data batch for anything Yahoo did not return. If both providers fail, it checks stale database rows and finally uses the predefined fallback index values.

### 20.3 Overview history execution

For `GET /api/v1/market/history/{symbol}`:

1. The interval is checked against `1min`, `5min`, `15min`, `30min`, `1h`, `1day`, and `1week`.
2. The requested output size is constrained by the API schema.
3. A key-value cache key is built from symbol, interval, and output size.
4. Redis is checked first.
5. PostgreSQL `MarketCache` is checked second for a value newer than 60 minutes.
6. Yahoo Finance is requested first.
7. Twelve Data is tried if Yahoo returns no rows and a key is configured.
8. Each row is parsed into a timestamp, open, high, low, close, and integer volume.
9. Invalid rows are skipped rather than failing the complete response.
10. Rows are sorted chronologically.
11. The response is written to Redis and PostgreSQL.
12. If both providers return no rows, the service generates deterministic fallback history for supported fallback assets using a seeded random generator. This is synthetic data and must not be presented as provider data.

### 20.4 Chat execution

For a chat request:

1. `ChatBot.jsx` rejects an empty input locally.
2. It immediately appends the user message to the UI.
3. It sets the typing state.
4. `askFinPilot` sends JSON to `POST /api/v1/chat`.
5. The backend calls `answer_query`.
6. The stock resolver attempts local database matching.
7. If needed, it searches Yahoo Finance for the company phrase, individual words, and three-character prefixes.
8. NSE and BSE equity results are retained.
9. The closest result is selected with `SequenceMatcher` similarity over names and symbols.
10. New stocks and their daily history are inserted into PostgreSQL.
11. The route classifier selects market data, technical analysis, attribution, or documents.
12. Deterministic evidence tools calculate facts.
13. The evidence is serialized as JSON.
14. The model receives the user request plus verified evidence.
15. If synthesis succeeds, its text is returned.
16. If synthesis fails, deterministic formatting is returned.
17. The API response includes answer, route, citations, and provider name.
18. The frontend appends the response and clears the typing state.
19. If the HTTP request fails, the frontend displays the error as an assistant message and clears typing state.

### 20.5 AI Research execution

For `POST /research/reports`:

1. JWT authentication identifies the user.
2. The request can include `company`, `ticker`, and `question`.
3. The route chooses the non-empty lookup context. The frontend clears the other input when the user edits one field, preventing stale default values from overriding the new stock.
4. `answer_query` resolves the stock and collects evidence.
5. The current quote is fetched from stored bars after dynamic Yahoo loading.
6. General market-data requests also collect 52-week high/low data where available.
7. Attribution requests collect return, close, volume ratio, volatility, and cached news.
8. Technical requests calculate RSI, SMA, EMA, MACD, ATR, Bollinger Bands, and volume ratio.
9. The evidence is sent to Groq through the OpenAI-compatible client.
10. The model is instructed not to replace verified values with guessed symbols or prices.
11. Unsupported provider behavior, empty output, or network/API errors are caught.
12. The deterministic formatter generates a usable report instead.
13. The resolved ticker is extracted from the evidence.
14. A `Report` row is saved with user ID, ticker, title, summary, status, timestamp, and generated content.
15. The API returns the saved report.
16. The frontend displays the content in its report sections and marks the visual workflow complete.

### 20.6 Deterministic research fallback output

The fallback is not an empty placeholder:

- For a quote, it includes company, symbol, price, change, percentage change, volume, and optional 52-week range.
- For attribution, it includes close, selected-window return, volume ratio, volatility, cached news titles, and a no-causation disclaimer.
- For technical analysis, it returns the calculated indicator object as JSON if the model is unavailable.
- For documents, it reports whether matching indexed evidence exists.
- For an unresolved query, it returns a clear request for a stock symbol or indexed document query.

### 20.7 Document upload execution, byte by byte

For `POST /research/documents`:

1. Authentication runs before the route body is processed.
2. FastAPI receives the multipart file.
3. The complete file is read into memory as `bytes`.
4. Files larger than 10 MB are rejected with HTTP `413`.
5. SHA-256 is calculated over the raw bytes.
6. The database is searched for the same checksum belonging to the same user.
7. If a duplicate exists, the existing document ID, status, and chunk count are returned. No new extraction or embedding call occurs.
8. Otherwise, a `Document` row is created with status `Processing`, original filename, byte size, MIME type, owner ID, and checksum.
9. The row is flushed to obtain its database ID.
10. `index_document` is called.
11. The filename suffix and MIME type determine the extractor:
    - PDF or `application/pdf`: `pypdf.PdfReader` reads pages and joins extracted page text with two newlines.
    - TXT, Markdown, CSV, JSON, LOG, or any `text/*` MIME type: bytes are decoded as UTF-8.
    - Any other type: the operation fails with a supported-type error.
12. If the extractor dependency is missing, PDF indexing fails with a dependency-specific message.
13. If PDF parsing fails, the document is marked `Failed` and the parser error is stored.
14. If UTF-8 decoding fails, the document is marked `Failed` and the encoding error is stored.
15. Empty extracted text is rejected.
16. Whitespace normalization changes runs of spaces/tabs to one space and runs of three or more newlines to two newlines.
17. The normalized full text is saved in `Document.extracted_text`.
18. Paragraphs are created by splitting on blank-line boundaries using `re.split(r"\n\s*\n", text)`.
19. Empty paragraphs are discarded.
20. Paragraphs are accumulated into the current chunk.
21. Before adding a paragraph, the code checks whether the current chunk plus the paragraph and two separator characters would exceed `CHUNK_SIZE = 1600`.
22. If it would exceed the limit, the current chunk is committed to the chunk list.
23. The last `CHUNK_OVERLAP = 240` characters of that committed chunk are copied into the next chunk.
24. The next paragraph is appended after that overlap, separated by two newlines.
25. The last non-empty current chunk is appended after the paragraph loop.
26. There is no fixed tokenization step; chunk size is measured in Python characters, not model tokens.
27. A very long individual paragraph is not hard-split before this check, so a single paragraph can exceed 1,600 characters.
28. The complete previous `DocumentChunk` rows are deleted before new chunks are inserted.
29. Embeddings are generated for the chunk list if an embedding provider is configured.
30. Each chunk is inserted with document ID, zero-based chunk index, text, character count, and optional serialized embedding.
31. The transaction commits.
32. The document status remains `Indexed` on success.
33. The route returns document ID, filename, size, status, chunk count, and the configured embedding model field when the OpenAI-style embedding condition is met.

### 20.8 Embedding execution and failure behavior

`create_embeddings` behaves as follows:

1. An empty text list produces an equally sized list of `None` values.
2. If `EMBEDDING_PROVIDER` is `huggingface` and no `HF_API_KEY` exists, every chunk receives `None` and indexing continues.
3. With Hugging Face configured, the service sends a POST request to:
   `HF_EMBEDDING_URL/HF_EMBEDDING_MODEL`.
4. The bearer token is sent only from the backend.
5. The payload contains `inputs` and `wait_for_model: true`.
6. A one-vector response is accepted directly.
7. A token-level response is mean-pooled across token vectors into one vector per input.
8. The normalized vector is JSON-serialized into the `embedding` text column.
9. If the Hugging Face request raises an HTTP or parsing error, the exception propagates through indexing; the document becomes `Failed` and the error is stored by the upload route.
10. If an OpenAI-compatible embedding provider is configured instead, the OpenAI SDK `embeddings.create` method is called with `EMBEDDING_MODEL` or `OPENAI_EMBEDDING_MODEL`.

### 20.9 Document retrieval execution

For `GET /research/documents/search?q=...` or an AI document tool call:

1. Empty queries are rejected with HTTP `422` at the route layer.
2. The query is scoped to the authenticated user ID.
3. Only documents with status `Indexed` are selected.
4. Stored chunks are loaded with their parent document.
5. A query embedding is attempted using the same embedding configuration.
6. Every chunk receives a lexical score based on the intersection of normalized terms of at least three characters.
7. If both query and chunk embeddings exist, cosine similarity is calculated.
8. The combined score is `0.55 * lexical_score + 0.45 * vector_score`.
9. Without a query embedding, the lexical score is used alone.
10. Zero-score chunks are discarded.
11. Remaining chunks are sorted descending by score.
12. The highest-ranked five results are returned by the internal orchestration helper, or up to ten by the document-search route.
13. Each result includes document ID, filename, chunk index, text, total score, lexical score, vector score, and citation metadata.
14. If embeddings are unavailable, retrieval still works through lexical matching.
15. If no terms match, the result is an empty list and the AI layer can explain that no indexed evidence was found.

## 21. Current authenticated chat workflow

This section describes the current implementation in `finpilot-frontend/src/Pages/ChatWorkspace.jsx`,
`backend/app/routers/chat.py`, `backend/app/ai/orchestration.py`, `backend/app/ai/agent.py`,
and `backend/app/services/rag.py`. It is the authoritative flow for the retained chat experience.

### 21.1 Frontend entry and authentication

1. The user opens `/dashboard/chat`.
2. `App.jsx` places the page behind `AuthProvider` and `ProtectedRoute`.
3. Login obtains a JWT from `POST /auth/token`; the frontend stores it in browser `localStorage`
   under `finpilot_user`.
4. `finpilotApi.js` reads that token and sends it as a bearer authorization header on chat
   requests.
5. FastAPI validates the JWT with `get_current_user()` and scopes conversations and documents
   to the authenticated user ID.

### 21.2 Chat initialization and conversation management

When `ChatWorkspace` mounts, it requests:

```text
GET /api/v1/chat/conversations
GET /api/v1/chat/documents
```

The most recent conversation is opened with:

```text
GET /api/v1/chat/conversations/{conversation_id}
```

The UI supports creating, opening, and deleting saved conversations. A new conversation starts
with the title `New chat`; after the first user message, the backend derives a shortened title
from that message. Messages are stored in `chat_messages`, and the last twelve messages are
passed to the model as conversation history.

### 21.3 Normal market-question flow

For a message without selected documents:

```text
React ChatWorkspace
  -> finpilotApi.js
  -> POST /api/v1/chat/conversations/{id}/messages
  -> chat.send_message
  -> answer_query
  -> ask_finpilot
  -> LangChain tool-calling agent
  -> market tool(s), if current data is needed
  -> configured LLM
  -> database persistence
  -> React answer and citations
```

The agent receives the last twelve user/assistant messages and a financial-research system
prompt. It chooses from these tools:

- `screen_indian_stock_movers`
- `get_stock_quote`
- `get_stock_history`
- `get_52_week_data`
- `get_technical_indicators`
- `get_stock_move_attribution`

The model is instructed to verify changing facts with tools, preserve dates and requested
counts, disclose limitations, and never invent market values. Each tool result is returned to
the model before the final answer is generated. NSE ranking answers are additionally checked
for missing symbols and altered numeric values; if the generated answer is not faithful, the
backend formats the verified NSE payload directly.

The backend then saves both the user message and assistant answer, updates the conversation
timestamp, and returns the answer, route, provider, model, and citations to the frontend.
Chat responses are currently complete HTTP responses; token streaming is not used by this flow.

### 21.4 Document upload and document-question flow

The user can upload PDF, TXT, Markdown, CSV, JSON, or LOG files up to 10 MB through:

```text
POST /api/v1/chat/documents
```

The backend validates the file, calculates a checksum for duplicate detection, extracts text
with `pypdf` for PDFs or UTF-8 decoding for text formats, and splits the text with
`RecursiveCharacterTextSplitter` using 1,000-character chunks and 150-character overlap.

Each chunk receives `user_id`, `document_id`, filename, page, and chunk metadata. The chunks
are persisted in `document_chunks` and indexed in the vector database. The document becomes
available for chat only after its status is `Indexed`.

When the user selects one or more indexed documents and sends a question:

```text
selected document IDs
  -> ownership/status validation
  -> previous user context + current question
  -> PGVector similarity search, up to seven passages
  -> source citation objects
  -> document-answer LangChain chain
  -> LLM answer using only retrieved passages
  -> answer and citations saved to chat_messages
```

The document prompt treats uploaded text as untrusted data, ignores instructions embedded in
the document, requires source citations, and tells the model to say when the retrieved passages
do not contain enough information.

### 21.5 Vector store and vector database clarification

FinPilot uses both terms for different layers of the same implementation:

- **Vector database:** PostgreSQL running from `pgvector/pgvector:pg17`, with the `pgvector`
  extension available for vector similarity search.
- **Vector store abstraction:** LangChain's `PGVector` class from `langchain-postgres`.
- **Collection name:** `finpilot_chat_documents`.
- **Embedding providers:** Hugging Face `HuggingFaceEndpointEmbeddings` when
  `EMBEDDING_PROVIDER=huggingface`, or OpenAI-compatible `OpenAIEmbeddings` otherwise.
- **SQL metadata tables:** `documents` and `document_chunks` store ownership, extracted text,
  chunk metadata, status, and indexing information.

Therefore, the concrete vector database is PostgreSQL plus pgvector, while `PGVector` is the
application/library vector-store interface used to write and search that database. Redis is
not the vector store; it is an optional short-lived cache for market responses.

The current PGVector implementation requires a PostgreSQL connection. The SQLite fallback is
not sufficient for the current chat document vector-search path.

## 22. What provides live market data

FinPilot uses several sources, depending on the question:

| Use case | Source | Live/current-data behavior |
|---|---|---|
| Market dashboard quotes, indices, history, exchange status, forex, commodities, and search | Twelve Data via `backend/app/provider/twelve_data.py` | Provider request when cache/database data is unavailable; results may be cached |
| Dynamic NSE/BSE equity lookup and on-demand history | Yahoo Finance via `backend/app/provider/yahoo_finance.py` | Public HTTP provider request; used for discovery/history and supported fallbacks |
| Market-wide NSE gainers, losers, percentage movers, and INR price movers | Official NSE UDiFF Common Bhavcopy Final via `backend/app/provider/nse_market.py` | Downloads the latest available daily NSE bhavcopy, trying the requested date and previous seven calendar days |
| Individual AI quote/history/technical answers | Stored `Stock` and `PriceBar` rows, populated by market-data loading/provider services | Not automatically live; the answer must retain the stored timestamp |

For the specific chat question "top NSE gainers/movers," the LLM must call
`screen_indian_stock_movers`, which uses the official NSE bhavcopy provider rather than the
stored application quote table. The NSE provider filters to regular `EQ` series stocks and
returns its trading date and source URL with the ranking.

The dashboard first checks Redis and PostgreSQL caches where configured. If no usable cached
value exists, it calls the relevant external provider and persists normalized results. Fallback
or stale values are not equivalent to live provider data and should be labeled accordingly.

## 23. Complete chat examples

### 23.1 NSE ranking question

For "Show the top five NSE gainers from yesterday":

1. React sends the authenticated chat request.
2. FastAPI verifies the conversation and loads recent history.
3. The LangChain agent selects `screen_indian_stock_movers`.
4. `nse_market.py` downloads NSE bhavcopy data for yesterday or the most recent prior trading day.
5. The CSV is filtered to `EQ` series and ranked by positive percentage change.
6. The verified JSON result returns to the model.
7. FinPilot checks that the final answer preserves symbols and numeric values.
8. The user and assistant messages are persisted.
9. React renders the final answer.

### 23.2 Document question

For "What are the main risks?" with a selected annual-report PDF:

1. The file is uploaded and indexed.
2. PDF text is extracted and split into overlapping chunks.
3. Embeddings are written to the `finpilot_chat_documents` PGVector collection.
4. The selected document ID accompanies the chat request.
5. PGVector retrieves the most relevant passages for the question and recent user context.
6. The document chain generates an answer only from those passages.
7. Page/chunk citations are saved with the assistant message and displayed in the UI.

## 24. Additional execution details

### 24.1 News refresh execution

For `GET /api/v1/news/`:

1. The service counts cached articles fetched within the last 30 minutes.
2. If at least five fresh articles exist, Alpha Vantage is not called.
3. If fewer than five exist and a non-demo Alpha Vantage key exists, `NEWS_SENTIMENT` is called.
4. The request can include ticker, topic, limit, and latest-first sorting.
5. Alpha Vantage rate-limit, information, and error payloads produce an empty refresh result rather than invalid articles.
6. Valid articles are normalized and inserted by URL, so duplicates are skipped.
7. If the provider request fails, the service logs the failure and queries cached rows anyway.
8. Topic and ticker filters are applied to the database query.
9. The response contains paginated articles and total count.

### 24.2 Technical indicator execution

When technical analysis is requested:

1. The service loads up to 252 stored bars.
2. The requested period must be at least 2.
3. It calculates close values, simple moving average, exponential moving average, RSI, MACD, ATR, Bollinger middle/upper/lower bands, and recent volume ratio.
4. EMA starts with a simple average for the initial period and then applies the multiplier `2 / (period + 1)`.
5. RSI uses average gains and losses over the requested period.
6. ATR uses true ranges based on high-low and previous close.
7. Bollinger bands use the period SMA plus or minus two standard deviations.
8. Missing minimum history returns a clear `ValueError` rather than fabricated indicators.

### 24.3 Streaming execution

For WebSocket `/api/v1/ws/market/{symbol}`:

1. The socket is accepted.
2. A database session is opened.
3. `StoredMarketDepthProvider.snapshot` requests the stored quote.
4. The payload includes symbol, UTC timestamp, bids, asks, best bid, best ask, spread, status, and last price.
5. The current implementation returns empty bids and asks with `provider_not_configured` because no broker order-book provider is installed.
6. The JSON payload is sent.
7. The server waits five seconds and repeats.
8. Database sessions are closed after each snapshot.
9. A disconnect stops the loop and is logged.
10. Other snapshot errors are converted into an error payload instead of crashing the WebSocket process.

## 25. Provider selection summary

The provider is selected according to the type of data requested. Dashboard data and
authenticated AI chat data do not always use the same provider.

### 25.1 Twelve Data

Twelve Data is used primarily for dashboard-oriented market data:

- Dashboard movers for a predefined list of popular Indian and US stocks.
- Market status, quotes, indices, forex, commodities, history, and symbol search where
  the relevant market-service path calls Twelve Data.
- A fallback for dashboard indices when Yahoo Finance does not return a symbol.
- A fallback for individual market-service quotes when Yahoo Finance does not return a
  usable quote.
- A fallback for historical data when Yahoo Finance returns no usable history.

The dashboard movers feature uses a limited popular-symbol list; it is not a complete
scan of every NSE-listed stock. If Twelve Data returns no usable mover data, the market
service can return predefined fallback mover values.

### 25.2 Yahoo Finance

Yahoo Finance is used for:

- Dynamic NSE/BSE equity discovery and company-name lookup.
- Individual quotes in the market-service provider order.
- Historical price data and on-demand daily bars.
- Dashboard indices, forex, and commodities when the dashboard needs external data.

For an individual market-service quote, the normal order is:

```text
fresh PostgreSQL MarketQuote
  -> Yahoo Finance
  -> Twelve Data
  -> stale PostgreSQL MarketQuote
  -> no result
```

For dashboard indices, the normal external-provider order after a cache miss is:

```text
Yahoo Finance
  -> Twelve Data for symbols missing from Yahoo
  -> stale PostgreSQL value
  -> predefined fallback value
```

Yahoo Finance uses public HTTP endpoints and does not require a configured provider key.

### 25.3 NSE UDiFF Common Bhavcopy

The official NSE UDiFF Common Bhavcopy provider is used for market-wide NSE cash-equity
rankings in AI chat:

- Top NSE gainers.
- Top NSE losers.
- Largest absolute percentage movers.
- Largest absolute INR price changes.

The LangChain agent calls `screen_indian_stock_movers`, which calls
`backend/app/provider/nse_market.py`. This provider downloads the latest available NSE
bhavcopy, filters to regular `EQ` series stocks, and ranks the complete available NSE
universe for the selected trading day.

It is not replaced by Twelve Data or Yahoo Finance if the official NSE ranking request
fails, because a different provider could use a different universe, date, or ranking
definition.

### 25.4 Dashboard versus chat behavior

The same word, such as "movers," can use different code paths:

| Request | Provider/path |
|---|---|
| Dashboard popular-stock movers | Twelve Data, using the configured popular-symbol list |
| Chat: "top 10 NSE gainers yesterday" | Official NSE UDiFF bhavcopy through `screen_indian_stock_movers` |
| Chat: "what is Reliance's price?" | Stored `Stock` and `PriceBar` rows through the AI market tools |
| Dashboard individual quote | Fresh database cache, then Yahoo Finance, then Twelve Data |
| Historical chart data | Yahoo Finance first, then Twelve Data |

The chat tools for individual stock quote, history, 52-week data, technical indicators,
and move attribution use stored application data through `StockService` and related
services. The model must preserve the data timestamp and must not automatically describe
it as live.

### 25.5 Cache and fallback order

Many dashboard requests check cached data before contacting an external provider:

```text
Redis cache
  -> fresh PostgreSQL MarketCache or MarketQuote
  -> external provider
  -> stale PostgreSQL value
  -> predefined or synthetic fallback where that feature supports one
```

The exact order differs by endpoint. A stale database row, predefined fallback value, or
synthetic history is not equivalent to live provider data and must be labeled or described
accordingly.

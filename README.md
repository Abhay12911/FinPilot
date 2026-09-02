# FinPilot 🧭

> **AI-powered financial intelligence platform** — Research, analyze, and manage your portfolio with institutional-grade tools powered by AI.

![FinPilot Dashboard](./finpilot-frontend/public/og-image.png)

---

## 📋 Table of Contents

- [Overview](#overview)
- [Architecture](#architecture)
- [Project Structure](#project-structure)
- [Quick Start](#quick-start)
- [Tech Stack](#tech-stack)
- [Features](#features)
- [Environment Variables](#environment-variables)
- [API Reference](#api-reference)
- [Roadmap](#roadmap)

---

## Overview

FinPilot is a full-stack SaaS fintech application that brings institutional-grade financial research and AI analysis to individual investors. It combines a premium React frontend with a FastAPI backend, backed by SQLite (dev) / PostgreSQL (prod).

---

## Architecture

```
┌──────────────────────────────────────────┐
│           Browser (React + Vite)         │
│   Tailwind CSS · Recharts · Framer Motion│
│            http://localhost:5173         │
└────────────────┬─────────────────────────┘
                 │ HTTP / REST (JSON)
                 ▼
┌──────────────────────────────────────────┐
│          FastAPI Backend (Python)        │
│    Uvicorn · SQLAlchemy · JWT Auth       │
│            http://127.0.0.1:8000         │
└────────────────┬─────────────────────────┘
                 │ SQLAlchemy ORM
                 ▼
┌──────────────────────────────────────────┐
│          SQLite (dev) / PostgreSQL (prod)│
│              finpilot.db                 │
└──────────────────────────────────────────┘
```

---

## Project Structure

```
FinPilot/
├── backend/                    # FastAPI Python backend
│   ├── app/
│   │   ├── main.py             # App entry point, CORS, router registration
│   │   ├── database.py         # SQLAlchemy engine & session
│   │   ├── auth.py             # JWT auth (register, login, /me)
│   │   ├── models/
│   │   │   ├── user.py         # User model
│   │   │   ├── portfolio.py    # Holding, WatchlistItem models
│   │   │   └── research.py     # Report, Document models
│   │   └── routers/
│   │       ├── portfolio.py    # /portfolio/* endpoints
│   │       ├── companies.py    # /companies/* endpoints
│   │       └── research.py     # /research/* endpoints
│   ├── .env                    # Environment variables
│   └── venv/                   # Python virtual environment
│
└── finpilot-frontend/          # React + Vite frontend
    ├── src/
    │   ├── App.jsx             # Root router
    │   ├── main.jsx            # React entry point
    │   ├── index.css           # Tailwind + custom design tokens
    │   ├── context/
    │   │   └── AuthContext.jsx # Auth state + real API integration
    │   ├── services/           # API service layer
    │   │   ├── api.js          # Base fetch client + JWT handling
    │   │   ├── companies.js    # Company data service
    │   │   ├── market.js       # Market data service
    │   │   ├── portfolio.js    # Portfolio service
    │   │   └── research.js     # Research/AI service
    │   ├── Pages/              # All page-level components (flat)
    │   │   ├── LandingPage.jsx
    │   │   ├── LoginPage.jsx
    │   │   ├── SignupPage.jsx
    │   │   ├── DashboardLayout.jsx
    │   │   ├── Overview.jsx
    │   │   ├── Portfolio.jsx
    │   │   ├── Watchlist.jsx
    │   │   ├── MarketOverview.jsx
    │   │   ├── MarketSignals.jsx
    │   │   ├── MarketNews.jsx
    │   │   ├── CompanyWorkspace.jsx
    │   │   ├── ChatBot.jsx
    │   │   ├── AIResearch.jsx
    │   │   ├── Compare.jsx
    │   │   ├── Reports.jsx
    │   │   ├── PersonalAnalyzer.jsx
    │   │   ├── Documents.jsx
    │   │   ├── BrokerIntegration.jsx
    │   │   ├── Sidebar.jsx
    │   │   └── Topbar.jsx
    │   └── components/
    │       ├── layout/
    │       │   └── DashboardLayout.jsx
    │       ├── shared/
    │       │   ├── AuthLayout.jsx
    │       │   └── ProtectedRoute.jsx
    │       └── ui/
    │           ├── MetricCard.jsx
    │           ├── ChartCard.jsx
    │           ├── SignalBadge.jsx
    │           ├── StockRow.jsx
    │           ├── Skeleton.jsx
    │           └── EmptyState.jsx
    └── package.json
```

---

## Quick Start

### Prerequisites

- **Node.js** ≥ 18
- **Python** ≥ 3.11
- **Git**

### 1. Clone

```bash
git clone <your-repo-url>
cd FinPilot
```

### 2. Backend Setup

```bash
cd backend

# Create & activate virtual environment
python -m venv venv
venv\Scripts\activate          # Windows
# source venv/bin/activate     # macOS/Linux

# Install dependencies
pip install fastapi uvicorn sqlalchemy python-jose[cryptography] \
            pwdlib[argon2] pydantic[email] pydantic-settings \
            python-multipart

# Configure environment
cp .env.example .env           # then edit .env

# Start the API server
uvicorn app.main:app --reload --port 8000
```

The API is now available at **http://127.0.0.1:8000**  
Interactive docs: **http://127.0.0.1:8000/docs**

### 3. Frontend Setup

```bash
cd ../finpilot-frontend

# Install dependencies
npm install

# Start the dev server
npm run dev
```

The app is now available at **http://localhost:5173**

---

## Tech Stack

### Frontend

| Library | Version | Purpose |
|---------|---------|---------|
| React | 19 | UI framework |
| Vite | 8 | Build tool + HMR |
| Tailwind CSS | 4 | Utility-first styling |
| Recharts | 3 | Financial charts |
| Framer Motion | 13 | Animations |
| Lucide React | latest | Icons |
| React Router | 7 | Client-side routing |

### Backend

| Library | Version | Purpose |
|---------|---------|---------|
| FastAPI | 0.141 | API framework |
| Uvicorn | 0.52 | ASGI server |
| SQLAlchemy | 2.0 | ORM |
| python-jose | 3.5 | JWT tokens |
| pwdlib | 0.3 | Password hashing (Argon2) |
| pydantic-settings | 2.15 | Environment config |
| SQLite | built-in | Development database |

---

## Features

| Feature | Status |
|---------|--------|
| Premium landing page | ✅ Done |
| JWT authentication (register/login) | ✅ Done |
| Protected dashboard routes | ✅ Done |
| Portfolio tracking & P&L | ✅ Done |
| Watchlist management | ✅ Done |
| Market overview with charts | ✅ Done |
| AI market signals | ✅ Done |
| Company workspace (price chart, financials, news) | ✅ Done |
| Market news with sentiment analysis | ✅ Done |
| AI deep research workflow | ✅ Done |
| AI chatbot (FinPilot Research) | ✅ Done |
| Stock comparison tool | ✅ Done |
| Personal portfolio analyzer | ✅ Done |
| Research reports | ✅ Done |
| Document management | ✅ Done |
| Broker integration UI | ✅ Done |
| Real market data API | 🔲 Planned |
| OpenAI / Gemini AI integration | 🔲 Planned |
| Broker API (Alpaca, IBKR) | 🔲 Planned |
| PostgreSQL production DB | 🔲 Planned |
| Docker deployment | 🔲 Planned |

---

## Environment Variables

### Backend (`backend/.env`)

```env
DATABASE_URL=sqlite:///./finpilot.db
SECRET_KEY=your-super-secret-jwt-key-change-in-production
```

### Frontend

No `.env` required for development. To point to a different API:

```env
# finpilot-frontend/.env.local (optional)
VITE_API_URL=http://127.0.0.1:8000
```

> Then update `src/services/api.js` to use `import.meta.env.VITE_API_URL`.

---

## API Reference

Base URL: `http://127.0.0.1:8000`  
Interactive docs: `http://127.0.0.1:8000/docs`

### Auth

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| `POST` | `/auth/register` | Register new user | No |
| `POST` | `/auth/token` | Login → JWT token | No |
| `GET` | `/auth/me` | Get current user | Yes |

### Portfolio

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| `GET` | `/portfolio/holdings` | Get user holdings | Yes |
| `POST` | `/portfolio/holdings` | Add holding | Yes |
| `DELETE` | `/portfolio/holdings/{id}` | Remove holding | Yes |
| `GET` | `/portfolio/watchlist` | Get watchlist | Yes |
| `POST` | `/portfolio/watchlist` | Add to watchlist | Yes |
| `DELETE` | `/portfolio/watchlist/{ticker}` | Remove from watchlist | Yes |

### Companies

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| `GET` | `/companies/{ticker}` | Company details | Yes |
| `GET` | `/companies/{ticker}/news` | Company news | Yes |
| `GET` | `/companies/search?q={query}` | Search companies | Yes |

### Research

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| `GET` | `/research/reports` | List AI reports | Yes |
| `POST` | `/research/reports` | Save new report | Yes |
| `DELETE` | `/research/reports/{id}` | Delete report | Yes |

---

## Roadmap

### Phase 1 — Core Platform (✅ Complete)
- Premium UI with 15 dashboard pages
- JWT-based full-stack authentication
- Mock data service layer (API-ready)
- Portfolio, watchlist, charts, signals

### Phase 2 — Live Data
- Integrate Alpha Vantage / Yahoo Finance / Polygon.io for real market data
- Replace mock services with real API calls
- WebSocket for live price updates

### Phase 3 — AI Integration
- Connect Gemini API for FinPilot AI chatbot
- Deep research using Google Search grounding
- Sentiment analysis on news articles

### Phase 4 — Production
- Migrate SQLite → PostgreSQL
- Docker Compose deployment
- CI/CD pipeline (GitHub Actions)
- Broker API integration (Alpaca paper trading)

---

## Contributing

1. Fork the repo
2. Create a feature branch: `git checkout -b feature/your-feature`
3. Commit changes: `git commit -m 'feat: add your feature'`
4. Push: `git push origin feature/your-feature`
5. Open a Pull Request

---

## License

MIT © FinPilot Team

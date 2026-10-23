# FinPilot frontend

React and Vite interface for AI Chat, AI Research, and the live market dashboard.

```bash
npm install
npm run dev
```

During local Vite development, the chat client uses the same-origin `/api/v1` path and Vite proxies it to `http://127.0.0.1:8000`. Set `VITE_API_URL` to the API host (for example, `https://api.example.com`) for a separately hosted API; the chat client adds `/api/v1` automatically, and an URL that already ends with `/api/v1` is also supported.

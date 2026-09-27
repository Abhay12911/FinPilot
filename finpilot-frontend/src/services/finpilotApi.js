const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:8000/api/v1";

async function request(path, options) {
  const response = await fetch(`${API_URL}${path}`, options);
  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(body.detail || "FinPilot request failed");
  }
  return response.json();
}

export function getQuote(symbol) {
  return request(`/stocks/${encodeURIComponent(symbol)}/quote`);
}

export function getHistory(symbol, limit = 30) {
  return request(`/stocks/${encodeURIComponent(symbol)}/history?limit=${limit}`);
}

export function searchStocks(query) {
  return request(`/stocks/search?q=${encodeURIComponent(query)}`);
}

export function askFinPilot(message, currentSymbol) {
  return request("/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message, current_symbol: currentSymbol ?? null }),
  });
}

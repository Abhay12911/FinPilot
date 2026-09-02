import { apiFetch } from './api';

// Market data is public on the backend (no auth required), so these all
// pass auth: false — that also means the Market Overview page can show
// real data even before a user logs in.

export function getMarketStatus(force = false) {
  return apiFetch(`/api/v1/market/status?force=${!!force}`, { auth: false });
}

export function getMarketIndices(force = false) {
  return apiFetch(`/api/v1/market/indices?force=${!!force}`, { auth: false });
}

export function getMarketQuote(symbol) {
  return apiFetch(`/api/v1/market/quote/${encodeURIComponent(symbol.toUpperCase())}`, { auth: false });
}

export function getMarketMovers(market, force = false) {
  return apiFetch(`/api/v1/market/movers?market=${encodeURIComponent(market)}&force=${!!force}`, { auth: false });
}

export function getSectorPerformance(market, force = false) {
  return apiFetch(`/api/v1/market/sectors?market=${encodeURIComponent(market)}&force=${!!force}`, { auth: false });
}

export function getMarketHistory(symbol, interval = '1day', outputsize = 100) {
  const params = new URLSearchParams({ interval, outputsize: String(outputsize) });
  return apiFetch(`/api/v1/market/history/${encodeURIComponent(symbol.toUpperCase())}?${params}`, { auth: false });
}

export function searchMarket(query) {
  return apiFetch(`/api/v1/market/search?q=${encodeURIComponent(query)}`, { auth: false });
}

export function getForex() {
  return apiFetch('/api/v1/market/forex', { auth: false });
}

export function getCommodities() {
  return apiFetch('/api/v1/market/commodities', { auth: false });
}

export function getMarketSignals() {
  return apiFetch('/api/v1/market/signals', { auth: false });
}

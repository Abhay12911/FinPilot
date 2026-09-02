import { apiFetch } from './api';

export function getPortfolioSummary() {
  return apiFetch('/portfolio/summary');
}

export function getPortfolioPerformance() {
  return apiFetch('/portfolio/performance');
}

export function getPortfolioHoldings() {
  return apiFetch('/portfolio/holdings');
}

export function getWatchlist() {
  return apiFetch('/portfolio/watchlist');
}

export function addToWatchlist(ticker, name) {
  return apiFetch('/portfolio/watchlist', {
    method: 'POST',
    body: { ticker: (ticker || '').toUpperCase().trim(), name: name || ticker },
  });
}

export function removeFromWatchlist(ticker) {
  return apiFetch(`/portfolio/watchlist/${encodeURIComponent(ticker)}`, {
    method: 'DELETE',
  });
}

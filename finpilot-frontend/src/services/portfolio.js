import { getToken } from './api';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';

async function apiRequest(path, options = {}) {
  const headers = { ...(options.headers || {}) };
  const token = getToken();
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  if (options.body && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }

  const res = await fetch(`${BASE_URL}${path}`, { ...options, headers });
  if (!res.ok) {
    let detail = `Request failed: ${res.status}`;
    try {
      const json = await res.json();
      detail = json.detail || detail;
    } catch {
      detail = `Request failed: ${res.status}`;
    }
    throw new Error(detail);
  }
  return res.json();
}

export const getPortfolioSummary = async () => {
  return apiRequest('/portfolio/summary');
};

export const getPortfolioPerformance = async () => {
  return apiRequest('/portfolio/performance');
};

export const getWatchlist = async () => {
  return apiRequest('/portfolio/watchlist');
};

export const addToWatchlist = async (ticker, name) => {
  return apiRequest('/portfolio/watchlist', {
    method: 'POST',
    body: JSON.stringify({ ticker, name })
  });
};

export const removeFromWatchlist = async (ticker) => {
  return apiRequest(`/portfolio/watchlist/${ticker}`, {
    method: 'DELETE'
  });
};

export const getHoldings = async () => {
  return apiRequest('/portfolio/holdings');
};

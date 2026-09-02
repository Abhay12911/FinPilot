

import { getToken } from './api';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';

async function apiRequest(path, options = {}) {
  const headers = { ...(options.headers || {}) };
  const token = getToken();
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
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

export const getMarketStatus = (force = false) => {
  return apiRequest(`/api/v1/market/status${force ? '?force=true' : ''}`);
};

export const getMarketIndices = (force = false) => {
  return apiRequest(`/api/v1/market/indices${force ? '?force=true' : ''}`);
};

export const getMarketMovers = (market, force = false) => {
  return apiRequest(`/api/v1/market/movers?market=${market}${force ? '&force=true' : ''}`);
};

export const getSectorPerformance = (market, force = false) => {
  return apiRequest(`/api/v1/market/sectors?market=${market}${force ? '&force=true' : ''}`);
};

export const getMarketHistory = (symbol, interval = '1day', outputsize = 100) => {
  return apiRequest(`/api/v1/market/history/${symbol}?interval=${interval}&outputsize=${outputsize}`);
};

export const searchMarket = (query) => {
  return apiRequest(`/api/v1/market/search?q=${query}`);
};

export const getForex = () => {
  return apiRequest('/api/v1/market/forex');
};

export const getCommodities = () => {
  return apiRequest('/api/v1/market/commodities');
};

export const getMarketSignals = () => {
  return apiRequest('/api/v1/market/signals');
};

export default {
  getMarketStatus,
  getMarketIndices,
  getMarketMovers,
  getSectorPerformance,
  getMarketHistory,
  searchMarket,
  getForex,
  getCommodities,
  getMarketSignals
};

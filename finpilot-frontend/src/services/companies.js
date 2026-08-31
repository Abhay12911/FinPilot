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

export const getCompanyDetails = async (ticker) => {
  return apiRequest(`/companies/${ticker}`);
};

export const getCompanyNews = async (ticker) => {
  return apiRequest(`/companies/${ticker}/news`);
};

export const searchCompanies = async (query) => {
  if (!query) return [];
  try {
    const res = await apiRequest(`/api/v1/market/search?q=${query}`);
    return (res.equities || []).map(item => ({
      ticker: item.symbol,
      name: item.name || item.symbol,
      sector: 'Equity'
    }));
  } catch (error) {
    console.error("Error in searchCompanies:", error);
    return [];
  }
};

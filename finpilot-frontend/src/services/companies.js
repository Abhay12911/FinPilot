import { apiFetch } from './api';

export function getCompanyDetails(ticker) {
  return apiFetch(`/companies/${encodeURIComponent(ticker.toUpperCase())}`);
}

export function getCompanyNews(ticker) {
  return apiFetch(`/companies/${encodeURIComponent(ticker.toUpperCase())}/news`);
}

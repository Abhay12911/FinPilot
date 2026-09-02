import { apiFetch } from './api';

export function fetchNews({ topic, ticker, limit = 50, skip = 0 } = {}) {
  const params = new URLSearchParams();
  if (topic) params.set('topic', topic);
  if (ticker) params.set('ticker', ticker);
  params.set('limit', String(limit));
  params.set('skip', String(skip));
  return apiFetch(`/api/v1/news/?${params}`, { auth: false });
}

export function fetchTopics() {
  return apiFetch('/api/v1/news/topics', { auth: false });
}

export function fetchSentiment() {
  return apiFetch('/api/v1/news/sentiment', { auth: false });
}

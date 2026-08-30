

const BASE_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';

export async function fetchNews({ topic = null, ticker = null, limit = 50, skip = 0 } = {}) {
  const params = new URLSearchParams();
  if (topic && topic !== 'All') params.set('topic', topic);
  if (ticker) params.set('ticker', ticker);
  params.set('limit', String(limit));
  params.set('skip', String(skip));

  const res = await fetch(`${BASE_URL}/api/v1/news/?${params}`);
  if (!res.ok) throw new Error(`News fetch failed: ${res.status}`);
  return res.json();
}

export async function fetchTopics() {
  const res = await fetch(`${BASE_URL}/api/v1/news/topics`);
  if (!res.ok) throw new Error(`Topics fetch failed: ${res.status}`);
  return res.json();
}

export async function fetchSentiment() {
  const res = await fetch(`${BASE_URL}/api/v1/news/sentiment`);
  if (!res.ok) throw new Error(`Sentiment fetch failed: ${res.status}`);
  return res.json();
}

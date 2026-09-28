import { getToken } from './api';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';

async function backendRequest(path, options = {}) {
  const headers = { ...(options.headers || {}) };
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;
  const response = await fetch(`${BASE_URL}${path}`, { ...options, headers });
  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(body.detail || `Request failed: ${response.status}`);
  }
  return response.json();
}

export const getResearchReports = async () => {
  const reports = await backendRequest('/research/reports');
  return reports.map(report => ({
    ...report,
    company: report.ticker,
    type: 'AI Research',
    date: report.createdAt,
    riskLevel: 'Unclassified',
    sources: report.content ? 1 : 0,
    sections: 1,
  }));
};

export const deleteResearchReport = async (id) => {
  await backendRequest(`/research/reports/${id}`, { method: 'DELETE' });
  return getResearchReports();
};

export const runDeepResearch = async (config) => {
  return backendRequest('/research/reports', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      ticker: config.ticker,
      company: config.company,
      question: `${config.objective || 'Comprehensive investment analysis'} for ${config.company || config.ticker}. Include market facts, technical risks, recent move context, and clearly label uncertainty.`,
    }),
  });
};

export const getDocuments = async () => {
  const documents = await backendRequest('/research/documents');
  return documents.map(document => ({
    ...document,
    company: 'Indexed source',
    type: document.name.split('.').pop()?.toUpperCase() || 'DOCUMENT',
    date: new Date(document.uploadedAt).toLocaleDateString(),
    pages: '-',
    size: `${(Number(document.size) / (1024 * 1024)).toFixed(2)} MB`,
    status: document.status.toLowerCase(),
  }));
};

export const uploadDocument = async (file) => {
  const body = new FormData();
  body.append('file', file);
  return backendRequest('/research/documents', { method: 'POST', body });
};

export const deleteDocument = async (id) => {
  return backendRequest(`/research/documents/${id}`, { method: 'DELETE' });
};

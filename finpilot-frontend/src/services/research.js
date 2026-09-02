import { apiFetch } from './api';

// --- Reports ---

export function getResearchReports() {
  return apiFetch('/research/reports');
}

export function addResearchReport({ ticker, title, summary, content }) {
  return apiFetch('/research/reports', {
    method: 'POST',
    body: { ticker, title, summary, content },
  });
}

export function deleteResearchReport(id) {
  return apiFetch(`/research/reports/${id}`, { method: 'DELETE' });
}

// --- Documents ---

export function getDocuments() {
  return apiFetch('/research/documents');
}

export function uploadDocument(name, size) {
  return apiFetch('/research/documents', {
    method: 'POST',
    body: { name, size, status: 'Processing' },
  });
}

export function updateDocumentStatus(id, status) {
  return apiFetch(`/research/documents/${id}`, {
    method: 'PATCH',
    body: { status },
  });
}

export function deleteDocument(id) {
  return apiFetch(`/research/documents/${id}`, { method: 'DELETE' });
}

// --- Deep research ---

// AIResearch.jsx already does the real work client-side: it fetches live
// company data + news via services/companies.js, builds the report
// sections from that real data, then calls addResearchReport() to persist
// it. runDeepResearch() itself has no dedicated backend endpoint — it's
// an orchestration checkpoint the UI awaits mid-flow. Keeping it as a
// resolved no-op preserves that flow instead of inventing an endpoint
// that duplicates what the client already does correctly with real data.
export async function runDeepResearch(_config) {
  return { started: true };
}

// --- Chat ---

export function sendChatMessage(message, history) {
  return apiFetch('/research/chat', {
    method: 'POST',
    body: { message, history },
  });
}

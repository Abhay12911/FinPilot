import { getToken } from './api';

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:8000/api/v1";

async function request(path, options = {}) {
  const token = getToken();
  const headers = new Headers(options.headers || {});
  if (token) headers.set('Authorization', `Bearer ${token}`);
  const response = await fetch(`${API_URL}${path}`, { ...options, headers });
  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    const detail = body.detail;
    throw new Error(typeof detail === 'string' ? detail : detail ? JSON.stringify(detail) : "FinPilot request failed");
  }
  if (response.status === 204) return null;
  return response.json();
}

export const listChatConversations = () => request('/chat/conversations');

export const createChatConversation = () => request('/chat/conversations', { method: 'POST' });

export const getChatConversation = (conversationId) => request(`/chat/conversations/${conversationId}`);

export const deleteChatConversation = (conversationId) => request(`/chat/conversations/${conversationId}`, { method: 'DELETE' });

export const listChatDocuments = () => request('/chat/documents');

export const uploadChatDocument = (file) => {
  const body = new FormData();
  body.append('file', file);
  return request('/chat/documents', { method: 'POST', body });
};

export const deleteChatDocument = (documentId) => request(`/chat/documents/${documentId}`, { method: 'DELETE' });

export const sendChatMessage = (conversationId, message, documentIds = [], currentSymbol = null) => request(
  `/chat/conversations/${conversationId}/messages`,
  {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message, document_ids: documentIds, current_symbol: currentSymbol }),
  },
);

export function askFinPilot(message, currentSymbol) {
  return request("/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message, current_symbol: currentSymbol ?? null }),
  });
}

export function runAIResearch(message, currentSymbol) {
  return request("/ai/query", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message, current_symbol: currentSymbol ?? null }),
  });
}

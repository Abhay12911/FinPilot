import { getToken } from './api';

const configuredApiUrl = (import.meta.env.VITE_API_URL || '/api/v1').replace(/\/+$/, '');
const API_URL = configuredApiUrl.startsWith('/')
  ? configuredApiUrl
  : configuredApiUrl.endsWith('/api/v1')
  ? configuredApiUrl
  : `${configuredApiUrl}/api/v1`;

async function request(path, options = {}) {
  const token = getToken();
  const headers = new Headers(options.headers || {});
  if (token) headers.set('Authorization', `Bearer ${token}`);
  let response;
  try {
    response = await fetch(`${API_URL}${path}`, { ...options, headers });
  } catch (error) {
    throw new Error(
      `Cannot connect to FinPilot API at ${API_URL}. Check that the backend is running and VITE_API_URL is correct.`,
      { cause: error },
    );
  }
  if (!response.ok) {
    const responseText = await response.text();
    let detail = responseText;
    try {
      const body = responseText ? JSON.parse(responseText) : {};
      detail = body.detail;
    } catch {
      detail = responseText;
    }
    throw new Error(
      typeof detail === 'string' && detail.trim()
        ? detail
        : `FinPilot request failed (${response.status} ${response.statusText})`,
    );
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

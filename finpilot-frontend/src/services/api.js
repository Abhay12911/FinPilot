export const BASE_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';

const TOKEN_KEY = 'finpilot_token';

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token) {
  if (token) localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken() {
  localStorage.removeItem(TOKEN_KEY);
}

export async function apiFetch(path, { method = 'GET', body, headers = {}, auth = true, isForm = false } = {}) {
  const token = auth ? getToken() : null;

  const finalHeaders = { ...headers };
  if (!isForm && body !== undefined) finalHeaders['Content-Type'] = 'application/json';
  if (token) finalHeaders['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers: finalHeaders,
    body: body === undefined ? undefined : (isForm ? body : JSON.stringify(body)),
  });

  if (res.status === 401) {
    clearToken();
  }

  if (!res.ok) {
    let detail = res.statusText;
    try {
      const errBody = await res.json();
      detail = errBody.detail || JSON.stringify(errBody);
    } catch {
    }
    const err = new Error(detail || `Request to ${path} failed with ${res.status}`);
    err.status = res.status;
    throw err;
  }

  if (res.status === 204) return null;
  return res.json();
}

export async function apiLogin(email, password) {
  const form = new URLSearchParams();
  form.append('username', email);
  form.append('password', password);
  const res = await fetch(`${BASE_URL}/auth/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: form.toString(),
  });
  if (!res.ok) {
    const errBody = await res.json().catch(() => ({}));
    throw new Error(errBody.detail || 'Login failed');
  }
  const data = await res.json();
  setToken(data.access_token);
  return data;
}

export async function apiRegister(email, password) {
  return apiFetch('/auth/register', {
    method: 'POST',
    body: { email, password },
    auth: false,
  });
}

export async function apiGetMe() {
  return apiFetch('/auth/me');
}

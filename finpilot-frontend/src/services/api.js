

const BASE_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';

export const getToken = () => {
  const stored = localStorage.getItem('finpilot_user');
  if (!stored) return null;
  try {
    return JSON.parse(stored).token ?? null;
  } catch {
    return null;
  }
};

async function request(path, options = {}, withAuth = false) {
  const headers = { ...(options.headers || {}) };

  if (withAuth) {
    const token = getToken();
    if (token) headers['Authorization'] = `Bearer ${token}`;
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

  if (res.status === 204) return null;
  return res.json();
}

export async function apiLogin(email, password) {
  const body = new URLSearchParams();
  body.append('username', email); 
  body.append('password', password);

  return request('/auth/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  });
}

export async function apiRegister(email, password) {
  return request('/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
}

export async function apiGetMe() {
  return request('/auth/me', {}, true);
}

export default { apiLogin, apiRegister, apiGetMe, getToken };

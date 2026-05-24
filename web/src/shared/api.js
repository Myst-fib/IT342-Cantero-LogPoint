// src/shared/api.js
// Wrapper around fetch that automatically attaches X-User-Email and X-User-Role
// headers from localStorage so the backend can identify the user even when
// the session cookie is blocked cross-domain (e.g. Render free tier).

const API = process.env.REACT_APP_API_URL || 'https://logpoint-backend.onrender.com';

function getUserHeaders() {
  try {
    const stored = localStorage.getItem('user');
    if (!stored) return {};
    const user = JSON.parse(stored);
    const headers = {};
    if (user.email) headers['X-User-Email'] = user.email;
    if (user.role)  headers['X-User-Role']  = user.role;
    return headers;
  } catch {
    return {};
  }
}

/**
 * Drop-in replacement for fetch() that:
 * 1. Prepends the API base URL if the path starts with /
 * 2. Always sends credentials: 'include'
 * 3. Automatically adds X-User-Email and X-User-Role headers
 */
export function apiFetch(path, options = {}) {
  const url = path.startsWith('http') ? path : `${API}${path}`;
  const userHeaders = getUserHeaders();

  const mergedOptions = {
    ...options,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...userHeaders,
      ...(options.headers || {}),
    },
  };

  return fetch(url, mergedOptions);
}

export default API;
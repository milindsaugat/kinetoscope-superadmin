/* ============================================================
   Config: apiHelper.js
   Description: Reusable authenticated API request helper.
                Automatically attaches JWT token from localStorage
                and handles common error responses.
   ============================================================ */

import { getApiUrl } from './apiUrl';

/**
 * Make an authenticated API request.
 * @param {string} path - API path (e.g., '/api/super-admin/clients')
 * @param {object} options - fetch options (method, body, headers, etc.)
 * @returns {Promise<object>} Parsed JSON response
 */
export async function apiRequest(path, options = {}) {
  const authData = localStorage.getItem('kfpl_auth');
  let token = '';
  if (authData) {
    try {
      const parsed = JSON.parse(authData);
      token = parsed.token || '';
    } catch (e) {
      console.error('Failed to parse auth data:', e);
    }
  }

  const url = getApiUrl(path);

  const headers = {
    'Authorization': `Bearer ${token}`,
    ...options.headers,
  };

  // Automatically stringify object body payloads and set JSON content type
  if (options.body && !(options.body instanceof FormData)) {
    if (!headers['Content-Type']) {
      headers['Content-Type'] = 'application/json';
    }
    if (typeof options.body === 'object') {
      options.body = JSON.stringify(options.body);
    }
  }

  const response = await fetch(url, {
    ...options,
    headers,
  });

  const text = await response.text();
  let data = {};
  try {
    data = text ? JSON.parse(text) : {};
  } catch (parseErr) {
    console.error('Failed to parse response JSON:', parseErr, 'Raw text:', text);
    const errorMessage = text || `Request failed with status ${response.status}`;
    const err = new Error(errorMessage);
    err.status = response.status;
    err.data = text;
    throw err;
  }

  if (!response.ok) {
    const errorMessage = data.message || data.error || `Request failed with status ${response.status}`;
    const err = new Error(errorMessage);
    err.status = response.status;
    err.data = data;
    throw err;
  }

  return data;
}

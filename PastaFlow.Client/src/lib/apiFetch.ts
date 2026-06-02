/**
 * Authenticated fetch wrapper.
 *
 * - Reads the JWT from localStorage and injects `Authorization: Bearer <token>`.
 * - On HTTP 401, fires a `auth:logout` CustomEvent so AuthContext clears the
 *   session and redirects the user to the login screen automatically.
 */

const TOKEN_KEY = 'pf_token';

export async function apiFetch(
  input: RequestInfo | URL,
  init: RequestInit = {},
): Promise<Response> {
  const token = localStorage.getItem(TOKEN_KEY);

  const headers = new Headers(init.headers);
  headers.set('Content-Type', headers.get('Content-Type') ?? 'application/json');

  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const response = await fetch(input, { ...init, headers });

  if (response.status === 401) {
    window.dispatchEvent(new CustomEvent('auth:logout'));
  }

  return response;
}

/**
 * Authenticated fetch wrapper.
 *
 * - Reads the JWT from localStorage and injects `Authorization: Bearer <token>`.
 * - On HTTP 401, fires a `auth:logout` CustomEvent so AuthContext clears the
 *   session and redirects the user to the login screen automatically.
 * - On HTTP 403, throws `ForbiddenError` and fires `api:forbidden` so the app
 *   can surface a permission-denied message.
 * - On HTTP 409 / 422, parses Problem Details JSON and rejects with `ApiError`
 *   so domain messages (e.g. stock insuficiente) propagate to callers.
 */

import { ForbiddenError, parseApiError } from './apiError';

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
    return response;
  }

  if (response.status === 403) {
    window.dispatchEvent(new CustomEvent('api:forbidden'));
    const problem = await parseApiError(response);
    throw new ForbiddenError(problem.title, problem.detail);
  }

  if (response.status === 409 || response.status === 422) {
    throw await parseApiError(response);
  }

  return response;
}

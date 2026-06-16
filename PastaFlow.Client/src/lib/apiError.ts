/**
 * Typed error for RFC 7807 Problem Details responses.
 *
 * The backend serialises FluentValidation field errors inside
 * `problem.Extensions["errors"]`, which appears as a top-level `errors`
 * key in the JSON response. Field names arrive in PascalCase (C# property
 * names) and are normalised to camelCase here so they match React form state.
 */

export interface ProblemDetails {
  status?: number;
  title?: string;
  detail?: string;
  /** FluentValidation per-field errors keyed by property name */
  errors?: Record<string, string[]>;
}

export class ApiError extends Error {
  readonly status: number;
  readonly title: string;
  readonly detail: string | undefined;
  /** Per-field validation messages, keys normalised to camelCase */
  readonly fieldErrors: Record<string, string[]>;

  constructor(
    status: number,
    title: string,
    detail: string | undefined,
    fieldErrors: Record<string, string[]>,
  ) {
    super(detail ?? title);
    this.name = 'ApiError';
    this.status = status;
    this.title = title;
    this.detail = detail;
    this.fieldErrors = fieldErrors;
  }

  /** HTTP 409 – any conflict response */
  get isConflict(): boolean {
    return this.status === 409;
  }

  /** HTTP 409 – optimistic-concurrency conflict (xmin / RowVersion) */
  get isConcurrencyConflict(): boolean {
    return this.status === 409 && this.title === 'Conflicto de concurrencia';
  }

  /**
   * HTTP 409 (regla de negocio / operación inválida) o 422 – errores de dominio
   * distintos del conflicto de concurrencia (p. ej. stock insuficiente).
   */
  get isBusinessRuleViolation(): boolean {
    return (
      (this.status === 409 && !this.isConcurrencyConflict) ||
      this.status === 422
    );
  }

  /** HTTP 400 with FluentValidation field-level messages */
  get isValidation(): boolean {
    return this.status === 400 && Object.keys(this.fieldErrors).length > 0;
  }

  /** HTTP 403 – authenticated but lacking permission for the action */
  get isForbidden(): boolean {
    return this.status === 403;
  }
}

/** Thrown when the user is authenticated but lacks permission for the requested action. */
export class ForbiddenError extends ApiError {
  constructor(title: string, detail: string | undefined) {
    super(403, title, detail, {});
    this.name = 'ForbiddenError';
  }
}

/**
 * Parses an RFC 7807 Problem Details body from a non-ok `Response`.
 */
export async function parseApiError(response: Response): Promise<ApiError> {
  let problem: ProblemDetails = {};
  try {
    problem = (await response.json()) as ProblemDetails;
  } catch {
    /* body was not JSON – fall through to generic error */
  }

  // Normalise PascalCase keys → camelCase (C# → TS)
  const rawErrors: Record<string, string[]> = problem.errors ?? {};
  const fieldErrors: Record<string, string[]> = {};
  for (const [key, msgs] of Object.entries(rawErrors)) {
    const camelKey = key.charAt(0).toLowerCase() + key.slice(1);
    fieldErrors[camelKey] = msgs;
  }

  return new ApiError(
    problem.status ?? response.status,
    problem.title ?? `Error ${response.status}`,
    problem.detail,
    fieldErrors,
  );
}

/**
 * Reads a non-ok `Response`, parses Problem Details JSON and throws `ApiError`.
 * Call after every `fetch` before consuming the body.
 */
export async function throwIfError(response: Response): Promise<void> {
  if (response.ok) return;
  throw await parseApiError(response);
}

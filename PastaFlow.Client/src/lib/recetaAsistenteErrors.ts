import { ApiError } from './apiError';

/**
 * Mensaje legible para errores del asistente de recetas (IA + API).
 */
export function formatRecetaAsistenteError(err: unknown): string {
  if (err instanceof ApiError) {
    if (err.status === 503) {
      return err.detail
        ?? 'El servicio de IA no está disponible en este momento. Intentá de nuevo en unos segundos.';
    }

    if (err.status === 502) {
      return err.detail
        ?? 'No se pudo procesar la respuesta de la IA. Intentá reformular el pedido.';
    }

    if (err.detail) {
      return err.detail;
    }

    return err.title;
  }

  if (err instanceof Error) {
    return err.message;
  }

  return 'Ocurrió un error al consultar el asistente de IA.';
}

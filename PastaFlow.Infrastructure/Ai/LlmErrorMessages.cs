namespace PastaFlow.Infrastructure.Ai;

internal static class LlmErrorMessages
{
    public const string QuotaExceeded =
        "El servicio de IA alcanzó el límite de uso. Esperá unos minutos e intentá de nuevo.";

    public const string TemporarilyUnavailable =
        "El servicio de IA está saturado o no respondió. Intentá de nuevo en unos segundos.";

    public const string EmptyResponse =
        "La IA no devolvió una respuesta. Intentá de nuevo o reformulá el pedido.";

    public const string InvalidJsonResponse =
        "La IA respondió en un formato inesperado. Intentá de nuevo o reformulá el pedido.";

    public const string NoUsableIngredients =
        "La IA no devolvió ingredientes utilizables. Reformulá el pedido o probá con otro enfoque.";

    public static string MissingApiKey(string provider) =>
        $"La API key de {provider} no está configurada. Contactá al administrador del sistema.";

    public static string ProviderError(string provider, int statusCode) =>
        statusCode is 429
            ? QuotaExceeded
            : statusCode is 503 or 502 or 504
                ? TemporarilyUnavailable
                : $"{provider} no pudo completar la solicitud (error {statusCode}). Intentá de nuevo.";
}

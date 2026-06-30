using System.Text.Json;
using PastaFlow.Application.Exceptions;

namespace PastaFlow.Application.Services;

public static class LlmJsonParser
{
    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNameCaseInsensitive = true
    };

    public static T Deserialize<T>(string rawText)
    {
        string json = ExtractJson(rawText);

        try
        {
            T? result = JsonSerializer.Deserialize<T>(json, JsonOptions);

            if (result is null)
            {
                throw new LlmServiceException(
                    "La IA respondió en un formato inesperado. Intentá de nuevo o reformulá el pedido.");
            }

            return result;
        }
        catch (JsonException)
        {
            throw new LlmServiceException(
                "La IA respondió en un formato inesperado. Intentá de nuevo o reformulá el pedido.");
        }
    }

    private static string ExtractJson(string rawText)
    {
        string trimmed = rawText.Trim();

        if (trimmed.StartsWith("```", StringComparison.Ordinal))
        {
            int firstNewline = trimmed.IndexOf('\n');
            int lastFence = trimmed.LastIndexOf("```", StringComparison.Ordinal);

            if (firstNewline >= 0 && lastFence > firstNewline)
            {
                trimmed = trimmed[(firstNewline + 1)..lastFence].Trim();
            }
        }

        return trimmed;
    }
}

using System.Text.Json;

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
        T? result = JsonSerializer.Deserialize<T>(json, JsonOptions);

        if (result is null)
        {
            throw new InvalidOperationException(
                "La IA no devolvió un JSON válido para la sugerencia de receta.");
        }

        return result;
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

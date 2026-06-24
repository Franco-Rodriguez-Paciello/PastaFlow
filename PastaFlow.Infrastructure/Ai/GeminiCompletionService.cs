using System.Net.Http.Json;
using System.Text.Json.Serialization;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Options;
using PastaFlow.Application.Interfaces;

namespace PastaFlow.Infrastructure.Ai;

/// <summary>
/// Implementación de ILlmCompletionService usando la API REST de Google Gemini.
/// Usa IHttpClientFactory (inyectado vía HttpClient tipado) para conexiones eficientes.
/// </summary>
public sealed class GeminiCompletionService(
    HttpClient httpClient,
    IOptions<GeminiOptions> options,
    IConfiguration configuration) : ILlmCompletionService
{
    public async Task<string> GenerateTextAsync(
        string systemPrompt,
        string userPrompt,
        CancellationToken cancellationToken = default)
    {
        string apiKey = ResolveApiKey();
        if (string.IsNullOrWhiteSpace(apiKey))
        {
            throw new InvalidOperationException(
                "La API key de Gemini no está configurada. Definí Gemini__ApiKey como variable de entorno " +
                "o agregá la clave en la sección Gemini del appsettings (solo desarrollo).");
        }

        string model = options.Value.Model;
        string path = $"v1beta/models/{model}:generateContent?key={apiKey}";

        var requestBody = new GeminiGenerateContentRequest(
            [
                new GeminiContent("user", [new GeminiPart(userPrompt)])
            ],
            new GeminiSystemInstruction([new GeminiPart(systemPrompt)]));

        using HttpResponseMessage response = await httpClient.PostAsJsonAsync(
            path,
            requestBody,
            cancellationToken);

        if (!response.IsSuccessStatusCode)
        {
            string errorBody = await response.Content.ReadAsStringAsync(cancellationToken);
            string message = (int)response.StatusCode == 429
                ? "Gemini rechazó la solicitud por límite de cuota o créditos agotados. " +
                  "Revisá tu plan en https://aistudio.google.com o cambiá Llm:Provider a \"Groq\" en appsettings."
                : $"Gemini respondió con error {(int)response.StatusCode}: {Truncate(errorBody, 300)}";
            throw new InvalidOperationException(message);
        }

        GeminiGenerateContentResponse? result = await response.Content
            .ReadFromJsonAsync<GeminiGenerateContentResponse>(cancellationToken);

        string? text = result?.Candidates?
            .FirstOrDefault()?
            .Content?
            .Parts?
            .FirstOrDefault()?
            .Text;

        if (string.IsNullOrWhiteSpace(text))
        {
            throw new InvalidOperationException(
                "Gemini no devolvió contenido en la respuesta. Verificá el modelo configurado y los límites del plan gratuito.");
        }

        return text;
    }

    private string ResolveApiKey() =>
        Environment.GetEnvironmentVariable("Gemini__ApiKey")
        ?? configuration[$"{GeminiOptions.SectionName}:ApiKey"]
        ?? options.Value.ApiKey;

    private static string Truncate(string value, int maxLength) =>
        value.Length <= maxLength ? value : value[..maxLength] + "…";

    private sealed record GeminiGenerateContentRequest(
        [property: JsonPropertyName("contents")] GeminiContent[] Contents,
        [property: JsonPropertyName("system_instruction")] GeminiSystemInstruction SystemInstruction);

    private sealed record GeminiSystemInstruction(
        [property: JsonPropertyName("parts")] GeminiPart[] Parts);

    private sealed record GeminiContent(
        [property: JsonPropertyName("role")] string Role,
        [property: JsonPropertyName("parts")] GeminiPart[] Parts);

    private sealed record GeminiPart(
        [property: JsonPropertyName("text")] string Text);

    private sealed class GeminiGenerateContentResponse
    {
        [JsonPropertyName("candidates")]
        public GeminiCandidate[]? Candidates { get; init; }
    }

    private sealed class GeminiCandidate
    {
        [JsonPropertyName("content")]
        public GeminiContentResponse? Content { get; init; }
    }

    private sealed class GeminiContentResponse
    {
        [JsonPropertyName("parts")]
        public GeminiPartResponse[]? Parts { get; init; }
    }

    private sealed class GeminiPartResponse
    {
        [JsonPropertyName("text")]
        public string? Text { get; init; }
    }
}

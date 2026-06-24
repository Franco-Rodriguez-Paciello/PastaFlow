using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json.Serialization;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Options;
using PastaFlow.Application.Interfaces;

namespace PastaFlow.Infrastructure.Ai;

/// <summary>
/// Implementación de ILlmCompletionService usando Groq (API compatible con OpenAI).
/// Tier gratuito sin tarjeta: https://console.groq.com
/// </summary>
public sealed class GroqCompletionService(
    HttpClient httpClient,
    IOptions<GroqOptions> options,
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
                "La API key de Groq no está configurada. Definí Groq__ApiKey como variable de entorno " +
                "o agregá la clave en la sección Groq del appsettings (solo desarrollo). " +
                "Obtené una gratis en https://console.groq.com");
        }

        using var request = new HttpRequestMessage(HttpMethod.Post, "openai/v1/chat/completions");
        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", apiKey);
        request.Content = JsonContent.Create(new GroqChatRequest(
            options.Value.Model,
            [
                new GroqMessage("system", systemPrompt),
                new GroqMessage("user", userPrompt)
            ]));

        using HttpResponseMessage response = await httpClient.SendAsync(request, cancellationToken);

        if (!response.IsSuccessStatusCode)
        {
            string errorBody = await response.Content.ReadAsStringAsync(cancellationToken);
            throw new InvalidOperationException(
                $"Groq respondió con error {(int)response.StatusCode}: {Truncate(errorBody, 300)}");
        }

        GroqChatResponse? result = await response.Content
            .ReadFromJsonAsync<GroqChatResponse>(cancellationToken);

        string? text = result?.Choices?
            .FirstOrDefault()?
            .Message?
            .Content;

        if (string.IsNullOrWhiteSpace(text))
        {
            throw new InvalidOperationException(
                "Groq no devolvió contenido en la respuesta. Verificá el modelo configurado y los límites del plan gratuito.");
        }

        return text;
    }

    private string ResolveApiKey() =>
        Environment.GetEnvironmentVariable("Groq__ApiKey")
        ?? configuration[$"{GroqOptions.SectionName}:ApiKey"]
        ?? options.Value.ApiKey;

    private static string Truncate(string value, int maxLength) =>
        value.Length <= maxLength ? value : value[..maxLength] + "…";

    private sealed record GroqChatRequest(
        [property: JsonPropertyName("model")] string Model,
        [property: JsonPropertyName("messages")] GroqMessage[] Messages);

    private sealed record GroqMessage(
        [property: JsonPropertyName("role")] string Role,
        [property: JsonPropertyName("content")] string Content);

    private sealed class GroqChatResponse
    {
        [JsonPropertyName("choices")]
        public GroqChoice[]? Choices { get; init; }
    }

    private sealed class GroqChoice
    {
        [JsonPropertyName("message")]
        public GroqMessageResponse? Message { get; init; }
    }

    private sealed class GroqMessageResponse
    {
        [JsonPropertyName("content")]
        public string? Content { get; init; }
    }
}

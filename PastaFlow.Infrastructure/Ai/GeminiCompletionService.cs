using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json.Serialization;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Options;
using PastaFlow.Application.Exceptions;
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
            throw new LlmServiceException(
                LlmErrorMessages.MissingApiKey("Gemini"),
                isTransient: false);
        }

        string model = options.Value.Model;
        string path = $"v1beta/models/{model}:generateContent?key={apiKey}";

        var requestBody = new GeminiGenerateContentRequest(
            [
                new GeminiContent("user", [new GeminiPart(userPrompt)])
            ],
            new GeminiSystemInstruction([new GeminiPart(systemPrompt)]));

        for (int attempt = 1; attempt <= LlmHttpRetry.MaxAttemptsCount; attempt++)
        {
            using HttpResponseMessage response = await httpClient.PostAsJsonAsync(
                path,
                requestBody,
                cancellationToken);

            if (response.IsSuccessStatusCode)
            {
                return await ParseSuccessResponseAsync(response, cancellationToken);
            }

            int statusCode = (int)response.StatusCode;

            if (attempt < LlmHttpRetry.MaxAttemptsCount && LlmHttpRetry.IsTransient(statusCode))
            {
                TimeSpan delay = LlmHttpRetry.GetDelayBeforeAttempt(attempt);
                await Task.Delay(delay, cancellationToken);
                continue;
            }

            throw new LlmServiceException(LlmErrorMessages.ProviderError("Gemini", statusCode));
        }

        throw new LlmServiceException(LlmErrorMessages.TemporarilyUnavailable);
    }

    private static async Task<string> ParseSuccessResponseAsync(
        HttpResponseMessage response,
        CancellationToken cancellationToken)
    {
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
            throw new LlmServiceException(LlmErrorMessages.EmptyResponse);
        }

        return text;
    }

    private string ResolveApiKey() =>
        Environment.GetEnvironmentVariable("Gemini__ApiKey")
        ?? configuration[$"{GeminiOptions.SectionName}:ApiKey"]
        ?? options.Value.ApiKey;

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

using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json.Serialization;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Options;
using PastaFlow.Application.Exceptions;
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
            throw new LlmServiceException(
                LlmErrorMessages.MissingApiKey("Groq"),
                isTransient: false);
        }

        var requestBody = new GroqChatRequest(
            options.Value.Model,
            [
                new GroqMessage("system", systemPrompt),
                new GroqMessage("user", userPrompt)
            ]);

        for (int attempt = 1; attempt <= LlmHttpRetry.MaxAttemptsCount; attempt++)
        {
            using var request = new HttpRequestMessage(HttpMethod.Post, "openai/v1/chat/completions");
            request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", apiKey);
            request.Content = JsonContent.Create(requestBody);

            using HttpResponseMessage response = await httpClient.SendAsync(request, cancellationToken);

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

            throw new LlmServiceException(LlmErrorMessages.ProviderError("Groq", statusCode));
        }

        throw new LlmServiceException(LlmErrorMessages.TemporarilyUnavailable);
    }

    private static async Task<string> ParseSuccessResponseAsync(
        HttpResponseMessage response,
        CancellationToken cancellationToken)
    {
        GroqChatResponse? result = await response.Content
            .ReadFromJsonAsync<GroqChatResponse>(cancellationToken);

        string? text = result?.Choices?
            .FirstOrDefault()?
            .Message?
            .Content;

        if (string.IsNullOrWhiteSpace(text))
        {
            throw new LlmServiceException(LlmErrorMessages.EmptyResponse);
        }

        return text;
    }

    private string ResolveApiKey() =>
        Environment.GetEnvironmentVariable("Groq__ApiKey")
        ?? configuration[$"{GroqOptions.SectionName}:ApiKey"]
        ?? options.Value.ApiKey;

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

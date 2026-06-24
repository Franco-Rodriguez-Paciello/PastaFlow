using System.Text.Json;
using PastaFlow.Application.DTOs;
using PastaFlow.Application.Interfaces;
using PastaFlow.Application.Services;

namespace PastaFlow.Application.Queries.Dashboard;

/// <summary>
/// Orquesta la generación del insight: contexto determinístico → JSON → narrativa con LLM.
/// </summary>
public sealed class GenerateComprasInsightQueryHandler(
    IComprasInsightContextBuilder contextBuilder,
    ILlmCompletionService llmCompletionService)
{
    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
        WriteIndented = true
    };

    public async Task<ComprasInsightDto> HandleAsync(
        GenerateComprasInsightQuery query,
        CancellationToken cancellationToken = default)
    {
        ComprasInsightContextDto contexto = await contextBuilder.BuildAsync(cancellationToken);
        string contextJson = JsonSerializer.Serialize(contexto, JsonOptions);

        string reporte = await llmCompletionService.GenerateTextAsync(
            ComprasInsightPrompts.SystemPrompt,
            ComprasInsightPrompts.BuildUserPrompt(contextJson),
            cancellationToken);

        return new ComprasInsightDto(reporte.Trim(), DateTime.UtcNow);
    }
}

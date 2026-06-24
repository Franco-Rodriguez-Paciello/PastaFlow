using System.Text.Json;
using PastaFlow.Application.DTOs;
using PastaFlow.Application.Interfaces;
using PastaFlow.Application.Services;
using PastaFlow.Domain.Entities;

namespace PastaFlow.Application.Commands.Dashboard;

/// <summary>
/// Genera el insight con IA y lo persiste en BD (manual o automático).
/// </summary>
public sealed class GenerateComprasInsightCommandHandler(
    IComprasInsightContextBuilder contextBuilder,
    ILlmCompletionService llmCompletionService,
    IComprasInsightEmailNotifier emailNotifier,
    IPastaFlowDbContext context)
{
    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
        WriteIndented = true
    };

    public async Task<GenerateComprasInsightResultDto> HandleAsync(
        GenerateComprasInsightCommand command,
        CancellationToken cancellationToken = default)
    {
        ComprasInsightContextDto contexto = await contextBuilder.BuildAsync(cancellationToken);
        string contextJson = JsonSerializer.Serialize(contexto, JsonOptions);

        string reporte = await llmCompletionService.GenerateTextAsync(
            ComprasInsightPrompts.SystemPrompt,
            ComprasInsightPrompts.BuildUserPrompt(contextJson),
            cancellationToken);

        var informe = new InformeComprasInsight(
            reporte.Trim(),
            command.Origen,
            contexto.DiaOperativo);

        context.InformesComprasInsight.Add(informe);
        await context.SaveChangesAsync(cancellationToken);

        var insight = new ComprasInsightDto(
            informe.Id,
            informe.Reporte,
            informe.GeneradoEnUtc,
            informe.Origen.ToString(),
            informe.DiaOperativo);

        ComprasInsightEmailResult email = await emailNotifier.NotifyIfConfiguredAsync(
            insight,
            command.Origen,
            command.EnviarPorEmail,
            cancellationToken);

        return new GenerateComprasInsightResultDto(insight, email.Estado, email.Detalle);
    }
}

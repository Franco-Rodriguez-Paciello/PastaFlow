using System.Text.Json;
using PastaFlow.Application.DTOs;
using PastaFlow.Application.Interfaces;
using PastaFlow.Application.Services;

namespace PastaFlow.Application.Commands.Planificacion;

/// <summary>
/// Calcula la predicción determinística y le pide a la IA una recomendación redactada.
/// La IA solo narra; los números provienen del servicio de predicción.
/// </summary>
public sealed class GenerarRecomendacionDemandaCommandHandler(
    IPrediccionDemandaService prediccionService,
    ILlmCompletionService llmCompletionService)
{
    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
        WriteIndented = true
    };

    public async Task<PrediccionDemandaDto> HandleAsync(
        GenerarRecomendacionDemandaCommand command,
        CancellationToken cancellationToken = default)
    {
        PrediccionDemandaDto prediccion = await prediccionService.CalcularAsync(
            command.Fecha,
            cancellationToken);

        string prediccionJson = JsonSerializer.Serialize(prediccion, JsonOptions);

        string recomendacion = await llmCompletionService.GenerateTextAsync(
            PrediccionDemandaPrompts.SystemPrompt,
            PrediccionDemandaPrompts.BuildUserPrompt(prediccionJson),
            cancellationToken);

        return prediccion with { RecomendacionIa = recomendacion.Trim() };
    }
}

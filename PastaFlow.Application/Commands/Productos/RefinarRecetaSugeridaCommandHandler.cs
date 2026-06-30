using System.Text.Json;
using PastaFlow.Application.DTOs;
using PastaFlow.Application.Interfaces;
using PastaFlow.Application.Services;

namespace PastaFlow.Application.Commands.Productos;

public sealed class RefinarRecetaSugeridaCommandHandler(
    IRecetaAsistenteContextBuilder contextBuilder,
    ILlmCompletionService llmCompletionService,
    RecetaSugeridaResultBuilder resultBuilder)
{
    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
        WriteIndented = true
    };

    public async Task<SugerirRecetaResultDto> HandleAsync(
        RefinarRecetaSugeridaCommand command,
        CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(command.BriefUsuario))
        {
            throw new ArgumentException("El brief original no puede estar vacío.");
        }

        if (string.IsNullOrWhiteSpace(command.MensajeRefinamiento))
        {
            throw new ArgumentException("Indicá qué querés ajustar en la sugerencia.");
        }

        ArgumentNullException.ThrowIfNull(command.SugerenciaAnterior);

        RecetaAsistenteContextDto contexto = await contextBuilder.BuildAsync(cancellationToken);
        string contextJson = JsonSerializer.Serialize(contexto, JsonOptions);
        string sugerenciaAnteriorJson = JsonSerializer.Serialize(command.SugerenciaAnterior, JsonOptions);

        string rawResponse = await llmCompletionService.GenerateTextAsync(
            RecetaAsistentePrompts.SystemPrompt,
            RecetaAsistentePrompts.BuildRefinementUserPrompt(
                contextJson,
                command.BriefUsuario.Trim(),
                sugerenciaAnteriorJson,
                command.MensajeRefinamiento.Trim(),
                command.CostoMaximoPorKg,
                command.PrecioVentaObjetivo),
            cancellationToken);

        RecetaSugeridaLlmResponse llm = LlmJsonParser.Deserialize<RecetaSugeridaLlmResponse>(rawResponse);

        return resultBuilder.Build(
            llm,
            contexto,
            command.CostoMaximoPorKg,
            command.PrecioVentaObjetivo);
    }
}

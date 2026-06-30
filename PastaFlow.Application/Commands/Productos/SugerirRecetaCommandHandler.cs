using System.Text.Json;
using PastaFlow.Application.DTOs;
using PastaFlow.Application.Interfaces;
using PastaFlow.Application.Services;
using PastaFlow.Domain.Models;
using PastaFlow.Domain.Services;

namespace PastaFlow.Application.Commands.Productos;

public sealed class SugerirRecetaCommandHandler(
    IRecetaAsistenteContextBuilder contextBuilder,
    ILlmCompletionService llmCompletionService,
    ICostoProduccionService costoProduccionService)
{
    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
        WriteIndented = true
    };

    public async Task<SugerirRecetaResultDto> HandleAsync(
        SugerirRecetaCommand command,
        CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(command.BriefUsuario))
        {
            throw new ArgumentException("El brief de la receta no puede estar vacío.");
        }

        RecetaAsistenteContextDto contexto = await contextBuilder.BuildAsync(cancellationToken);
        string contextJson = JsonSerializer.Serialize(contexto, JsonOptions);

        string rawResponse = await llmCompletionService.GenerateTextAsync(
            RecetaAsistentePrompts.SystemPrompt,
            RecetaAsistentePrompts.BuildUserPrompt(
                contextJson,
                command.BriefUsuario.Trim(),
                command.CostoMaximoPorKg,
                command.PrecioVentaObjetivo),
            cancellationToken);

        RecetaSugeridaLlmResponse llm = LlmJsonParser.Deserialize<RecetaSugeridaLlmResponse>(rawResponse);

        var catalogoPorId = contexto.InsumosCatalogo.ToDictionary(i => i.Id);
        var advertencias = new List<string>(llm.Advertencias ?? []);
        var existentes = new List<IngredienteExistenteSugeridoDto>();
        var idsUsados = new HashSet<int>();

        foreach (IngredienteExistenteLlmItem item in llm.IngredientesExistentes ?? [])
        {
            if (item.CantidadPorKg <= 0)
            {
                advertencias.Add($"Se omitió un insumo con cantidad inválida (id {item.IngredienteId}).");
                continue;
            }

            if (!catalogoPorId.TryGetValue(item.IngredienteId, out InsumoCatalogoContextDto? insumo))
            {
                advertencias.Add(
                    $"El insumo con id {item.IngredienteId} no existe en el catálogo y fue omitido.");
                continue;
            }

            if (!idsUsados.Add(item.IngredienteId))
            {
                advertencias.Add($"El insumo '{insumo.Nombre}' estaba duplicado y se consolidó una sola vez.");
                continue;
            }

            decimal costoParcial = item.CantidadPorKg * insumo.CostoActual;
            existentes.Add(new IngredienteExistenteSugeridoDto(
                insumo.Id,
                insumo.Nombre,
                insumo.UnidadMedida,
                item.CantidadPorKg,
                insumo.CostoActual,
                costoParcial));
        }

        var propuestos = new List<IngredientePropuestoSugeridoDto>();
        int indicePropuesto = 0;

        foreach (IngredientePropuestoLlmItem item in llm.IngredientesPropuestos ?? [])
        {
            if (string.IsNullOrWhiteSpace(item.NombreSugerido) || item.CantidadPorKg <= 0)
            {
                advertencias.Add("Se omitió un insumo propuesto con datos incompletos.");
                continue;
            }

            string unidad = NormalizeUnidadMedida(item.UnidadMedida);
            decimal costoEstimado = Math.Max(0, item.CostoUnitarioEstimado);
            string? nombreSimilar = null;

            if (item.InsumoSimilarId is int similarId)
            {
                if (catalogoPorId.TryGetValue(similarId, out InsumoCatalogoContextDto? similar))
                {
                    nombreSimilar = similar.Nombre;
                }
                else
                {
                    advertencias.Add(
                        $"El insumo similar id {similarId} para '{item.NombreSugerido}' no existe en catálogo.");
                }
            }

            propuestos.Add(new IngredientePropuestoSugeridoDto(
                $"propuesto-{indicePropuesto++}",
                item.NombreSugerido.Trim(),
                unidad,
                item.CantidadPorKg,
                costoEstimado,
                string.IsNullOrWhiteSpace(item.Motivo) ? null : item.Motivo.Trim(),
                item.InsumoSimilarId,
                nombreSimilar,
                item.CantidadPorKg * costoEstimado));
        }

        if (existentes.Count == 0 && propuestos.Count == 0)
        {
            throw new InvalidOperationException(
                "La IA no devolvió ingredientes utilizables. Intentá reformular el brief.");
        }

        decimal costoConfirmado = costoProduccionService.CalcularCostoTotal(
            existentes.Select(e => new ItemRecetaParaCosto(
                e.IngredienteId,
                e.Nombre,
                e.CantidadPorKg,
                e.CostoUnitario,
                0)).ToList(),
            cantidadProducida: 1m);

        decimal costoEstimadoAdicional = propuestos.Sum(p => p.CostoParcialEstimado);
        decimal costoTotalProyectado = costoConfirmado + costoEstimadoAdicional;
        bool tienePendientes = propuestos.Count > 0;

        decimal? costoMaximo = command.CostoMaximoPorKg;
        bool superaMaximo = costoMaximo is > 0 && costoTotalProyectado > costoMaximo.Value;

        if (superaMaximo)
        {
            advertencias.Add(
                $"El costo proyectado (${costoTotalProyectado:N2}/kg) supera el máximo indicado (${costoMaximo!.Value:N2}/kg).");
        }

        decimal? margen = null;
        if (command.PrecioVentaObjetivo is > 0)
        {
            margen = command.PrecioVentaObjetivo.Value - costoTotalProyectado;
        }

        if (margen is < 0)
        {
            advertencias.Add(
                $"Con el precio objetivo (${command.PrecioVentaObjetivo:N2}/kg) el margen proyectado sería negativo.");
        }

        return new SugerirRecetaResultDto(
            string.IsNullOrWhiteSpace(llm.NombreProductoSugerido)
                ? "Nueva pasta sugerida"
                : llm.NombreProductoSugerido.Trim(),
            string.IsNullOrWhiteSpace(llm.Descripcion) ? string.Empty : llm.Descripcion.Trim(),
            string.IsNullOrWhiteSpace(llm.NotasElaboracion) ? null : llm.NotasElaboracion.Trim(),
            existentes,
            propuestos,
            advertencias,
            new CostoRecetaSugeridaDto(
                costoConfirmado,
                costoEstimadoAdicional,
                costoTotalProyectado,
                tienePendientes,
                superaMaximo,
                margen,
                command.CostoMaximoPorKg,
                command.PrecioVentaObjetivo));
    }

    private static string NormalizeUnidadMedida(string? unidad)
    {
        if (string.IsNullOrWhiteSpace(unidad))
        {
            return "Kilogramo";
        }

        return unidad.Trim() switch
        {
            "kg" or "Kilogramo" or "kilogramo" => "Kilogramo",
            "l" or "Litro" or "litro" => "Litro",
            "unidad" or "Unidad" => "Unidad",
            "docena" or "Docena" => "Docena",
            _ => "Kilogramo"
        };
    }

    private sealed class RecetaSugeridaLlmResponse
    {
        public string? NombreProductoSugerido { get; init; }
        public string? Descripcion { get; init; }
        public string? NotasElaboracion { get; init; }
        public List<IngredienteExistenteLlmItem>? IngredientesExistentes { get; init; }
        public List<IngredientePropuestoLlmItem>? IngredientesPropuestos { get; init; }
        public List<string>? Advertencias { get; init; }
    }

    private sealed class IngredienteExistenteLlmItem
    {
        public int IngredienteId { get; init; }
        public decimal CantidadPorKg { get; init; }
    }

    private sealed class IngredientePropuestoLlmItem
    {
        public string? NombreSugerido { get; init; }
        public string? UnidadMedida { get; init; }
        public decimal CantidadPorKg { get; init; }
        public decimal CostoUnitarioEstimado { get; init; }
        public string? Motivo { get; init; }
        public int? InsumoSimilarId { get; init; }
    }
}

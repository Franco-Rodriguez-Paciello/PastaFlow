using Microsoft.EntityFrameworkCore;
using PastaFlow.Application.DTOs;
using PastaFlow.Application.Interfaces;
using PastaFlow.Application.Queries.HojaProduccion;

namespace PastaFlow.Application.Queries.Compras;

public sealed class GetSugerenciasCompraQueryHandler(
    IPastaFlowDbContext context,
    GetHojaProduccionDiaQueryHandler hojaHandler)
{
    public async Task<IReadOnlyCollection<SugerenciaCompraDto>> HandleAsync(
        GetSugerenciasCompraQuery query,
        CancellationToken cancellationToken = default)
    {
        DateOnly fecha = query.FechaHoja ?? DateOnly.FromDateTime(DateTime.UtcNow).AddDays(1);
        HojaProduccionDiaDto hoja = await hojaHandler.HandleAsync(
            new GetHojaProduccionDiaQuery(fecha),
            cancellationToken);

        var sugerencias = new Dictionary<int, SugerenciaCompraDto>();

        foreach (InsumoAgregadoHojaDto insumo in hoja.InsumosAgregados.Where(i => !i.Suficiente))
        {
            sugerencias[insumo.IngredienteId] = new SugerenciaCompraDto(
                insumo.IngredienteId,
                insumo.Nombre,
                UnidadMedida: string.Empty,
                insumo.StockDisponible,
                insumo.Faltante,
                PrecioReferencia: null,
                Motivo: "FaltanteProduccion");
        }

        var criticos = await context.Ingredientes
            .AsNoTracking()
            .Where(i => i.StockActual <= i.UmbralCritico)
            .OrderBy(i => i.StockActual)
            .ToListAsync(cancellationToken);

        Dictionary<int, decimal> preciosReferencia = await ObtenerPreciosReferenciaAsync(
            criticos.Select(c => c.Id).Concat(sugerencias.Keys).Distinct().ToArray(),
            cancellationToken);

        foreach (Domain.Entities.Ingrediente ing in criticos)
        {
            decimal sugerida = Math.Max(ing.UmbralCritico - ing.StockActual, 0);
            if (sugerida <= 0) sugerida = ing.UmbralCritico;

            if (sugerencias.TryGetValue(ing.Id, out SugerenciaCompraDto? existente))
            {
                sugerencias[ing.Id] = existente with
                {
                    UnidadMedida = ing.UnidadMedida.ToString(),
                    CantidadSugerida = Math.Max(existente.CantidadSugerida, sugerida),
                    PrecioReferencia = preciosReferencia.GetValueOrDefault(ing.Id),
                    Motivo = "FaltanteProduccion"
                };
            }
            else
            {
                sugerencias[ing.Id] = new SugerenciaCompraDto(
                    ing.Id,
                    ing.Nombre,
                    ing.UnidadMedida.ToString(),
                    ing.StockActual,
                    Math.Round(sugerida, 2),
                    preciosReferencia.GetValueOrDefault(ing.Id),
                    "StockCritico");
            }
        }

        foreach (int id in sugerencias.Keys.ToList())
        {
            SugerenciaCompraDto s = sugerencias[id];
            if (string.IsNullOrEmpty(s.UnidadMedida))
            {
                string? unidad = await context.Ingredientes
                    .AsNoTracking()
                    .Where(i => i.Id == id)
                    .Select(i => i.UnidadMedida.ToString())
                    .FirstOrDefaultAsync(cancellationToken);

                sugerencias[id] = s with
                {
                    UnidadMedida = unidad ?? string.Empty,
                    PrecioReferencia = s.PrecioReferencia ?? preciosReferencia.GetValueOrDefault(id)
                };
            }
        }

        return sugerencias.Values
            .OrderByDescending(s => s.Motivo == "FaltanteProduccion")
            .ThenByDescending(s => s.CantidadSugerida)
            .ThenBy(s => s.Nombre)
            .ToList();
    }

    private async Task<Dictionary<int, decimal>> ObtenerPreciosReferenciaAsync(
        int[] ingredienteIds,
        CancellationToken cancellationToken)
    {
        if (ingredienteIds.Length == 0)
            return [];

        return await context.ProveedorIngredientes
            .AsNoTracking()
            .Where(pi => ingredienteIds.Contains(pi.IngredienteId) && pi.EsPreferido)
            .GroupBy(pi => pi.IngredienteId)
            .Select(g => new { IngredienteId = g.Key, Precio = g.Max(pi => pi.PrecioReferencia) })
            .ToDictionaryAsync(x => x.IngredienteId, x => x.Precio, cancellationToken);
    }
}

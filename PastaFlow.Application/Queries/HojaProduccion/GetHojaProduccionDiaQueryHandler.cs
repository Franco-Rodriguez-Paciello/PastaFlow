using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using PastaFlow.Application.DTOs;
using PastaFlow.Application.Interfaces;
using PastaFlow.Application.Options;
using PastaFlow.Domain.Entities;
using PastaFlow.Domain.Models;
using PastaFlow.Domain.Services;

namespace PastaFlow.Application.Queries.HojaProduccion;

public sealed class GetHojaProduccionDiaQueryHandler(
    IPrediccionDemandaService prediccionDemanda,
    IPastaFlowDbContext context,
    ICostoProduccionService costoProduccionService,
    IOptions<ComprasInsightOptions> options)
{
    public async Task<HojaProduccionDiaDto> HandleAsync(
        GetHojaProduccionDiaQuery query,
        CancellationToken cancellationToken = default)
    {
        PrediccionDemandaDto prediccion = await prediccionDemanda.CalcularAsync(
            query.FechaObjetivo,
            cancellationToken);

        if (prediccion.Productos.Count == 0)
        {
            return new HojaProduccionDiaDto(
                prediccion.FechaObjetivo,
                prediccion.EsFinDeSemana,
                prediccion.EsDia29,
                prediccion.Clima,
                prediccion.TotalUnidadesPredichas,
                TotalFaltaProducir: 0,
                LineasConFalta: 0,
                LineasStockOk: 0,
                PuedeProducirTodo: true,
                Lineas: [],
                InsumosAgregados: []);
        }

        int[] productoIds = prediccion.Productos.Select(p => p.ProductoId).Distinct().ToArray();

        Dictionary<int, Producto> productos = await context.Productos
            .AsNoTracking()
            .Where(p => productoIds.Contains(p.Id))
            .Include(p => p.Receta)
                .ThenInclude(ri => ri.Ingrediente)
            .ToDictionaryAsync(p => p.Id, cancellationToken);

        Dictionary<int, decimal> producidoHoyPorProducto = await CargarProducidoHoyAsync(cancellationToken);

        var lineas = new List<HojaProduccionLineaDto>();
        var demandaAgregadaInsumos = new Dictionary<int, (string Nombre, decimal Requerido)>();

        foreach (PrediccionProductoDto pred in prediccion.Productos)
        {
            productos.TryGetValue(pred.ProductoId, out Producto? producto);

            bool esCompuesto = producto?.TipoProducto == TipoProducto.Compuesto;
            bool tieneReceta = producto is not null && producto.Receta.Count > 0;
            decimal stockTerminado = producto?.StockActual ?? 0;
            decimal producidoHoy = producidoHoyPorProducto.GetValueOrDefault(pred.ProductoId);
            decimal faltaProducir = Math.Max(0, pred.PrediccionUnidades - stockTerminado);
            faltaProducir = Math.Round(faltaProducir, 2);

            bool stockInsumosOk = false;
            decimal? costoEstimado = null;
            decimal? margenEstimado = null;
            IReadOnlyCollection<DetalleCostoIngredienteDto> detalleInsumos = [];

            if (esCompuesto && tieneReceta && faltaProducir > 0)
            {
                List<ItemRecetaParaCosto> items = producto!.Receta
                    .Select(ri => new ItemRecetaParaCosto(
                        ri.IngredienteId,
                        ri.Ingrediente.Nombre,
                        ri.CantidadRequerida,
                        ri.Ingrediente.CostoActual,
                        ri.Ingrediente.StockActual))
                    .ToList();

                IReadOnlyList<DetalleCostoIngrediente> detalle = costoProduccionService
                    .CalcularDetalleCostos(items, faltaProducir);

                decimal costoTotal = costoProduccionService.CalcularCostoTotal(items, faltaProducir);
                costoEstimado = costoTotal;
                margenEstimado = costoProduccionService.CalcularMargenEstimado(
                    producto.PrecioVenta,
                    faltaProducir,
                    costoTotal);

                stockInsumosOk = detalle.All(d => d.StockSuficiente);

                detalleInsumos = detalle
                    .Select(d => new DetalleCostoIngredienteDto(
                        d.IngredienteId,
                        d.NombreIngrediente,
                        d.CantidadRequeridaPorUnidad,
                        d.CantidadTotalRequerida,
                        d.CostoUnitario,
                        d.CostoParcial,
                        d.StockDisponible,
                        d.StockSuficiente))
                    .ToList();

                foreach (DetalleCostoIngrediente d in detalle)
                {
                    if (demandaAgregadaInsumos.TryGetValue(d.IngredienteId, out var actual))
                    {
                        demandaAgregadaInsumos[d.IngredienteId] = (
                            actual.Nombre,
                            actual.Requerido + d.CantidadTotalRequerida);
                    }
                    else
                    {
                        demandaAgregadaInsumos[d.IngredienteId] = (d.NombreIngrediente, d.CantidadTotalRequerida);
                    }
                }
            }
            else if (faltaProducir <= 0)
            {
                stockInsumosOk = true;
            }

            lineas.Add(new HojaProduccionLineaDto(
                pred.ProductoId,
                pred.Nombre,
                pred.PrediccionUnidades,
                stockTerminado,
                producidoHoy,
                faltaProducir,
                esCompuesto,
                tieneReceta,
                stockInsumosOk,
                costoEstimado,
                margenEstimado,
                detalleInsumos));
        }

        Dictionary<int, decimal> stockInsumos = await context.Ingredientes
            .AsNoTracking()
            .Where(i => demandaAgregadaInsumos.Keys.Contains(i.Id))
            .ToDictionaryAsync(i => i.Id, i => i.StockActual, cancellationToken);

        var insumosAgregados = demandaAgregadaInsumos
            .Select(kv =>
            {
                decimal stock = stockInsumos.GetValueOrDefault(kv.Key);
                decimal faltante = Math.Max(0, kv.Value.Requerido - stock);
                return new InsumoAgregadoHojaDto(
                    kv.Key,
                    kv.Value.Nombre,
                    Math.Round(kv.Value.Requerido, 2),
                    stock,
                    Math.Round(faltante, 2),
                    stock >= kv.Value.Requerido);
            })
            .OrderByDescending(i => i.Faltante)
            .ThenBy(i => i.Nombre)
            .ToList();

        decimal totalFalta = lineas.Sum(l => l.CantidadFaltaProducir);
        int lineasConFalta = lineas.Count(l => l.CantidadFaltaProducir > 0);
        int lineasStockOk = lineas.Count(l =>
            l.CantidadFaltaProducir <= 0 ||
            (l.TieneReceta && l.StockInsumosSuficiente));

        return new HojaProduccionDiaDto(
            prediccion.FechaObjetivo,
            prediccion.EsFinDeSemana,
            prediccion.EsDia29,
            prediccion.Clima,
            prediccion.TotalUnidadesPredichas,
            totalFalta,
            lineasConFalta,
            lineasStockOk,
            insumosAgregados.Count == 0 || insumosAgregados.All(i => i.Suficiente),
            lineas,
            insumosAgregados);
    }

    private async Task<Dictionary<int, decimal>> CargarProducidoHoyAsync(CancellationToken cancellationToken)
    {
        TimeZoneInfo zona = TimeZoneInfo.FindSystemTimeZoneById(options.Value.ZonaHoraria);
        DateTime ahoraLocal = TimeZoneInfo.ConvertTimeFromUtc(DateTime.UtcNow, zona);
        DateTime inicioDia = ahoraLocal.Date;
        DateTime finDia = inicioDia.AddDays(1).AddTicks(-1);

        DateTime inicioUtc = TimeZoneInfo.ConvertTimeToUtc(
            DateTime.SpecifyKind(inicioDia, DateTimeKind.Unspecified),
            zona);
        DateTime finUtc = TimeZoneInfo.ConvertTimeToUtc(
            DateTime.SpecifyKind(finDia, DateTimeKind.Unspecified),
            zona);

        return await context.HistorialProduccion
            .AsNoTracking()
            .Where(h => h.FechaDeRegistro >= inicioUtc && h.FechaDeRegistro <= finUtc)
            .GroupBy(h => h.ProductoId)
            .Select(g => new { ProductoId = g.Key, Total = g.Sum(h => h.CantidadProducida) })
            .ToDictionaryAsync(x => x.ProductoId, x => x.Total, cancellationToken);
    }
}

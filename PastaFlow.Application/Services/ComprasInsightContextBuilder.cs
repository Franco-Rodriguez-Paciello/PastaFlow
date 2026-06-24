using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using PastaFlow.Application.DTOs;
using PastaFlow.Application.Interfaces;
using PastaFlow.Application.Options;
using PastaFlow.Domain.Entities;

namespace PastaFlow.Application.Services;

/// <summary>
/// Consulta la BD y calcula proyecciones determinísticas (sin IA).
/// La IA solo recibe este JSON ya procesado; no hace cálculos de stock.
/// </summary>
public sealed class ComprasInsightContextBuilder(
    IPastaFlowDbContext context,
    IOptions<ComprasInsightOptions> options) : IComprasInsightContextBuilder
{
    public async Task<ComprasInsightContextDto> BuildAsync(CancellationToken cancellationToken = default)
    {
        ComprasInsightOptions config = options.Value;
        TimeZoneInfo zona = ResolveTimeZone(config.ZonaHoraria);
        DateTime consultaUtc = DateTime.UtcNow;
        DateTime consultaLocal = TimeZoneInfo.ConvertTimeFromUtc(consultaUtc, zona);
        DateOnly diaOperativo = ResolveDiaOperativo(consultaLocal, config.HoraInicioDia);

        DateTime historialDesdeUtc = consultaUtc.AddDays(-config.DiasHistorial);

        var insumosCriticos = await context.Ingredientes
            .AsNoTracking()
            .Where(i => i.StockActual <= i.UmbralCritico)
            .OrderBy(i => i.StockActual)
            .Select(i => new InsumoCriticoContextDto(
                i.Nombre,
                i.StockActual,
                i.UmbralCritico,
                i.UnidadMedida.ToString(),
                i.CostoActual))
            .ToListAsync(cancellationToken);

        var mermasRaw = await context.AjustesStock
            .AsNoTracking()
            .Include(a => a.Insumo)
            .Where(a => a.Motivo == MotivoAjuste.Merma && a.FechaRegistro >= historialDesdeUtc)
            .ToListAsync(cancellationToken);

        var mermasRecientes = mermasRaw
            .GroupBy(a => new { a.InsumoId, a.Insumo.Nombre, a.Insumo.UnidadMedida })
            .Select(g => new MermaRecienteContextDto(
                g.Key.Nombre,
                g.Sum(a => a.Cantidad),
                g.Key.UnidadMedida.ToString(),
                g.Count()))
            .OrderByDescending(m => m.CantidadTotal)
            .Take(10)
            .ToList();

        var variacionesPrecio = await context.HistorialPreciosIngrediente
            .AsNoTracking()
            .Include(h => h.Ingrediente)
            .Where(h => h.FechaRegistro >= historialDesdeUtc && h.PrecioCostoAnterior > 0)
            .OrderByDescending(h => h.FechaRegistro)
            .ToListAsync(cancellationToken);

        var variacionesPorInsumo = variacionesPrecio
            .GroupBy(h => h.IngredienteId)
            .Select(g =>
            {
                HistorialPrecioIngrediente ultimo = g.First();
                decimal variacion = (ultimo.PrecioCostoNuevo - ultimo.PrecioCostoAnterior)
                    / ultimo.PrecioCostoAnterior * 100m;
                return new VariacionPrecioContextDto(
                    ultimo.Ingrediente.Nombre,
                    ultimo.PrecioCostoAnterior,
                    ultimo.PrecioCostoNuevo,
                    Math.Round(variacion, 1),
                    ultimo.FechaRegistro);
            })
            .Where(v => Math.Abs(v.VariacionPorcentaje) >= 1m)
            .OrderByDescending(v => Math.Abs(v.VariacionPorcentaje))
            .Take(10)
            .ToList();

        var demandaFinDeSemana = await CalcularDemandaFinDeSemanaAsync(
            zona,
            config.FinesDeSemanaHistorial,
            cancellationToken);

        var consumoPorInsumo = await CalcularConsumoProyectadoAsync(demandaFinDeSemana, cancellationToken);

        var reposiciones = await CalcularReposicionesSugeridasAsync(
            consumoPorInsumo,
            cancellationToken);

        return new ComprasInsightContextDto(
            consultaUtc,
            diaOperativo.ToString("yyyy-MM-dd"),
            config.HoraInicioDia.ToString(@"hh\:mm"),
            config.ZonaHoraria,
            insumosCriticos,
            mermasRecientes,
            variacionesPorInsumo,
            demandaFinDeSemana,
            reposiciones);
    }

    private async Task<IReadOnlyCollection<ProductoDemandaFinDeSemanaDto>> CalcularDemandaFinDeSemanaAsync(
        TimeZoneInfo zona,
        int finesDeSemanaHistorial,
        CancellationToken cancellationToken)
    {
        DateTime localNow = TimeZoneInfo.ConvertTimeFromUtc(DateTime.UtcNow, zona);
        DateTime desdeLocal = localNow.Date.AddDays(-(finesDeSemanaHistorial * 7 + 7));
        DateTime desdeUtc = TimeZoneInfo.ConvertTimeToUtc(desdeLocal, zona);

        var detalles = await context.DetallesVenta
            .AsNoTracking()
            .Where(d => d.Venta.Fecha >= desdeUtc)
            .Select(d => new
            {
                d.ProductoId,
                d.Producto.Nombre,
                d.Cantidad,
                d.Venta.Fecha
            })
            .ToListAsync(cancellationToken);

        var ventasFinDeSemana = detalles
            .Select(d => new
            {
                d.ProductoId,
                d.Nombre,
                d.Cantidad,
                FechaLocal = TimeZoneInfo.ConvertTimeFromUtc(d.Fecha, zona).Date
            })
            .Where(d => d.FechaLocal.DayOfWeek is DayOfWeek.Friday or DayOfWeek.Saturday or DayOfWeek.Sunday)
            .ToList();

        if (ventasFinDeSemana.Count == 0)
            return [];

        return ventasFinDeSemana
            .GroupBy(v => new { v.ProductoId, v.Nombre })
            .Select(g =>
            {
                decimal promedio = (decimal)g
                    .GroupBy(x => GetSabadoDeFinDeSemana(x.FechaLocal))
                    .Average(weekend => weekend.Sum(x => x.Cantidad));

                int finesAnalizados = g
                    .Select(x => GetSabadoDeFinDeSemana(x.FechaLocal))
                    .Distinct()
                    .Count();

                return new ProductoDemandaFinDeSemanaDto(
                    g.Key.Nombre,
                    Math.Round(promedio, 2),
                    finesAnalizados);
            })
            .Where(p => p.PromedioUnidadesPorFinDeSemana > 0)
            .OrderByDescending(p => p.PromedioUnidadesPorFinDeSemana)
            .Take(10)
            .ToList();
    }

    private async Task<Dictionary<int, decimal>> CalcularConsumoProyectadoAsync(
        IReadOnlyCollection<ProductoDemandaFinDeSemanaDto> demanda,
        CancellationToken cancellationToken)
    {
        if (demanda.Count == 0)
            return [];

        var nombresProducto = demanda.Select(d => d.NombreProducto).ToHashSet(StringComparer.OrdinalIgnoreCase);

        var recetas = await context.RecetaIngredientes
            .AsNoTracking()
            .Include(r => r.Producto)
            .Include(r => r.Ingrediente)
            .Where(r => nombresProducto.Contains(r.Producto.Nombre))
            .ToListAsync(cancellationToken);

        var demandaPorNombre = demanda.ToDictionary(d => d.NombreProducto, StringComparer.OrdinalIgnoreCase);
        var consumo = new Dictionary<int, decimal>();

        foreach (RecetaIngrediente item in recetas)
        {
            if (!demandaPorNombre.TryGetValue(item.Producto.Nombre, out ProductoDemandaFinDeSemanaDto? proyeccion))
                continue;

            decimal consumoInsumo = proyeccion.PromedioUnidadesPorFinDeSemana * item.CantidadRequerida;
            consumo[item.IngredienteId] = consumo.GetValueOrDefault(item.IngredienteId) + consumoInsumo;
        }

        return consumo;
    }

    private async Task<IReadOnlyCollection<ReposicionSugeridaContextDto>> CalcularReposicionesSugeridasAsync(
        Dictionary<int, decimal> consumoPorInsumo,
        CancellationToken cancellationToken)
    {
        var ingredientes = await context.Ingredientes
            .AsNoTracking()
            .ToListAsync(cancellationToken);

        var sugerencias = new List<ReposicionSugeridaContextDto>();

        foreach (Ingrediente insumo in ingredientes)
        {
            decimal consumoProyectado = Math.Round(consumoPorInsumo.GetValueOrDefault(insumo.Id), 2);
            bool bajoUmbral = insumo.StockActual <= insumo.UmbralCritico;
            decimal cantidadSugerida = Math.Max(0m, consumoProyectado + insumo.UmbralCritico - insumo.StockActual);

            if (!bajoUmbral && cantidadSugerida <= 0)
                continue;

            string motivo = bajoUmbral && consumoProyectado > 0
                ? "Stock bajo umbral y demanda proyectada para el fin de semana"
                : bajoUmbral
                    ? "Stock por debajo del umbral crítico"
                    : "Demanda proyectada para el fin de semana supera el stock disponible";

            sugerencias.Add(new ReposicionSugeridaContextDto(
                insumo.Nombre,
                insumo.StockActual,
                consumoProyectado,
                Math.Round(cantidadSugerida, 2),
                insumo.UnidadMedida.ToString(),
                motivo));
        }

        return sugerencias
            .OrderByDescending(s => s.StockActual <= 0 ? 1 : 0)
            .ThenBy(s => s.StockActual)
            .Take(15)
            .ToList();
    }

    private static DateOnly ResolveDiaOperativo(DateTime consultaLocal, TimeSpan horaInicioDia)
    {
        DateTime inicioHoy = consultaLocal.Date + horaInicioDia;
        DateTime referencia = consultaLocal < inicioHoy
            ? consultaLocal.AddDays(-1)
            : consultaLocal;
        return DateOnly.FromDateTime(referencia);
    }

    private static DateOnly GetSabadoDeFinDeSemana(DateTime fechaLocal) =>
        fechaLocal.DayOfWeek switch
        {
            DayOfWeek.Saturday => DateOnly.FromDateTime(fechaLocal),
            DayOfWeek.Sunday => DateOnly.FromDateTime(fechaLocal.AddDays(-1)),
            DayOfWeek.Friday => DateOnly.FromDateTime(fechaLocal.AddDays(1)),
            _ => DateOnly.FromDateTime(fechaLocal)
        };

    private static TimeZoneInfo ResolveTimeZone(string zonaHorariaId)
    {
        try
        {
            return TimeZoneInfo.FindSystemTimeZoneById(zonaHorariaId);
        }
        catch (TimeZoneNotFoundException)
        {
            return TimeZoneInfo.FindSystemTimeZoneById("Argentina Standard Time");
        }
        catch (InvalidTimeZoneException)
        {
            return TimeZoneInfo.FindSystemTimeZoneById("Argentina Standard Time");
        }
    }
}

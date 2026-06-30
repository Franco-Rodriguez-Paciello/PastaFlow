using Microsoft.EntityFrameworkCore;
using PastaFlow.Application.DTOs;
using PastaFlow.Application.Interfaces;

namespace PastaFlow.Application.Services;

/// <summary>
/// Predicción de demanda determinística basada en heurísticas de calendario y clima:
/// promedio histórico por tipo de día (semana / fin de semana), factor de uplift del día 29
/// y factor de clima (días fríos/lluviosos) aprendido del histórico de ventas.
/// El pronóstico del clima del día objetivo proviene de una API real (IClimaProvider).
/// La IA, si se solicita, solo redacta la recomendación sobre estos números.
/// </summary>
public sealed class PrediccionDemandaService(
    IPastaFlowDbContext context,
    IClimaProvider clima) : IPrediccionDemandaService
{
    private const int MesesAnalisis = 6;
    private const int DiasPrueba = 42; // 6 semanas de holdout para el backtest
    private const decimal UmbralFactorVisible = 1.05m;

    public async Task<PrediccionDemandaDto> CalcularAsync(
        DateOnly fechaObjetivo,
        CancellationToken cancellationToken = default)
    {
        DateOnly hasta = DateOnly.FromDateTime(DateTime.UtcNow);
        DateOnly desde = hasta.AddMonths(-MesesAnalisis);

        List<VentaRegistro> registros = await CargarRegistrosAsync(desde, cancellationToken);
        int totalVentas = registros.Select(r => r.VentaId).Distinct().Count();

        IReadOnlyList<FactoresProducto> modelo = ConstruirModelo(registros, desde, hasta);

        PronosticoDiaResult pronostico = await clima.ObtenerPronosticoAsync(fechaObjetivo, cancellationToken);

        bool esFinde = EsFinDeSemana(fechaObjetivo.DayOfWeek);
        bool es29 = fechaObjetivo.Day == 29;
        bool esClimaFrio = pronostico.Disponible && pronostico.EsFrioOLluvioso;

        var productos = modelo
            .Select(f => ConstruirDto(f, esFinde, es29, esClimaFrio))
            .OrderByDescending(p => p.PrediccionUnidades)
            .ThenBy(p => p.Nombre)
            .ToList();

        decimal totalPredicho = productos.Sum(p => p.PrediccionUnidades);

        var climaDto = new ClimaPronosticoDto(
            pronostico.Disponible,
            pronostico.TempMaxC,
            pronostico.PrecipMm,
            esClimaFrio,
            pronostico.Descripcion);

        return new PrediccionDemandaDto(
            fechaObjetivo,
            esFinde,
            es29,
            climaDto,
            new RangoAnalisisDemandaDto(desde, hasta, ContarDias(desde, hasta).total, totalVentas),
            productos,
            totalPredicho,
            RecomendacionIa: null);
    }

    public async Task<BacktestDemandaDto> BacktestAsync(CancellationToken cancellationToken = default)
    {
        DateOnly hasta = DateOnly.FromDateTime(DateTime.UtcNow);
        DateOnly desde = hasta.AddMonths(-MesesAnalisis);
        DateOnly finEntrenamiento = hasta.AddDays(-DiasPrueba);

        List<VentaRegistro> registros = await CargarRegistrosAsync(desde, cancellationToken);

        List<VentaRegistro> entrenamiento = registros
            .Where(r => r.Fecha <= finEntrenamiento)
            .ToList();

        IReadOnlyList<FactoresProducto> modelo = ConstruirModelo(entrenamiento, desde, finEntrenamiento);

        Dictionary<DateOnly, decimal> realPorDia = registros
            .Where(r => r.Fecha > finEntrenamiento)
            .GroupBy(r => r.Fecha)
            .ToDictionary(g => g.Key, g => (decimal)g.Sum(x => x.Cantidad));

        var serie = new List<PuntoBacktestDto>();
        decimal sumaErrorRelativo = 0m;
        int diasConVenta = 0;

        for (DateOnly d = finEntrenamiento.AddDays(1); d <= hasta; d = d.AddDays(1))
        {
            bool esFinde = EsFinDeSemana(d.DayOfWeek);
            bool es29 = d.Day == 29;
            bool esFrio = clima.EsFrioOLluviosoHistorico(d);

            decimal predicho = modelo.Sum(f => Predecir(f, esFinde, es29, esFrio));
            decimal real = realPorDia.GetValueOrDefault(d, 0m);

            serie.Add(new PuntoBacktestDto(d, real, predicho));

            if (real > 0)
            {
                sumaErrorRelativo += Math.Abs(real - predicho) / real;
                diasConVenta++;
            }
        }

        decimal mape = diasConVenta > 0
            ? Math.Round(sumaErrorRelativo / diasConVenta * 100m, 1)
            : 0m;
        decimal precision = Math.Max(0m, Math.Round(100m - mape, 1));

        return new BacktestDemandaDto(
            mape,
            precision,
            diasConVenta,
            finEntrenamiento.AddDays(1),
            hasta,
            serie);
    }

    public async Task<IReadOnlyList<SerieDiariaDto>> SerieHistoricaAsync(
        int dias,
        CancellationToken cancellationToken = default)
    {
        int ventana = dias <= 0 ? 90 : dias;
        DateOnly hasta = DateOnly.FromDateTime(DateTime.UtcNow);
        DateOnly desde = hasta.AddDays(-(ventana - 1));

        List<VentaRegistro> registros = await CargarRegistrosAsync(desde, cancellationToken);

        Dictionary<DateOnly, decimal> porDia = registros
            .GroupBy(r => r.Fecha)
            .ToDictionary(g => g.Key, g => (decimal)g.Sum(x => x.Cantidad));

        var serie = new List<SerieDiariaDto>();
        for (DateOnly d = desde; d <= hasta; d = d.AddDays(1))
            serie.Add(new SerieDiariaDto(d, porDia.GetValueOrDefault(d, 0m)));

        return serie;
    }

    private async Task<List<VentaRegistro>> CargarRegistrosAsync(
        DateOnly desde,
        CancellationToken cancellationToken)
    {
        DateTime desdeUtc = desde.ToDateTime(TimeOnly.MinValue, DateTimeKind.Utc);

        var raw = await context.DetallesVenta
            .AsNoTracking()
            .Where(d => d.Venta.Fecha >= desdeUtc)
            .Select(d => new
            {
                d.Venta.Fecha,
                d.VentaId,
                d.ProductoId,
                Nombre = d.Producto.Nombre,
                d.Cantidad
            })
            .ToListAsync(cancellationToken);

        return raw
            .Select(r => new VentaRegistro(
                DateOnly.FromDateTime(r.Fecha),
                r.VentaId,
                r.ProductoId,
                r.Nombre,
                r.Cantidad))
            .ToList();
    }

    private IReadOnlyList<FactoresProducto> ConstruirModelo(
        IReadOnlyList<VentaRegistro> registros,
        DateOnly desde,
        DateOnly hasta)
    {
        (int total, int semana, int finde, int dia29, int frio, int normal) c = ContarDias(desde, hasta);

        return registros
            .GroupBy(r => new { r.ProductoId, r.Nombre })
            .Select(g =>
            {
                decimal total = 0, sumFinde = 0, sum29 = 0, sumFrio = 0;

                foreach (VentaRegistro r in g)
                {
                    total += r.Cantidad;
                    if (EsFinDeSemana(r.Fecha.DayOfWeek)) sumFinde += r.Cantidad;
                    if (r.Fecha.Day == 29) sum29 += r.Cantidad;
                    if (clima.EsFrioOLluviosoHistorico(r.Fecha)) sumFrio += r.Cantidad;
                }

                decimal promedioDiario = c.total > 0 ? total / c.total : 0m;
                decimal avgSemana = c.semana > 0 ? (total - sumFinde) / c.semana : 0m;
                decimal avgFinde = c.finde > 0 ? sumFinde / c.finde : 0m;

                decimal avg29 = c.dia29 > 0 ? sum29 / c.dia29 : 0m;
                decimal factor29 = promedioDiario > 0 && avg29 > 0 ? avg29 / promedioDiario : 1m;

                decimal avgFrio = c.frio > 0 ? sumFrio / c.frio : 0m;
                decimal avgNormal = c.normal > 0 ? (total - sumFrio) / c.normal : 0m;
                decimal factorClima = avgNormal > 0 && avgFrio > 0 ? avgFrio / avgNormal : 1m;

                return new FactoresProducto(
                    g.Key.ProductoId,
                    g.Key.Nombre,
                    avgSemana,
                    avgFinde,
                    promedioDiario,
                    factor29,
                    factorClima);
            })
            .ToList();
    }

    private static decimal Predecir(FactoresProducto f, bool esFinde, bool es29, bool esFrio)
    {
        decimal valor = esFinde ? f.AvgFinde : f.AvgSemana;
        if (es29) valor *= f.Factor29;
        if (esFrio) valor *= f.FactorClima;
        return Math.Max(0m, Math.Round(valor, MidpointRounding.AwayFromZero));
    }

    private static PrediccionProductoDto ConstruirDto(
        FactoresProducto f,
        bool esFinde,
        bool es29,
        bool esFrio)
    {
        decimal baseDiaTipo = esFinde ? f.AvgFinde : f.AvgSemana;
        decimal prediccion = Predecir(f, esFinde, es29, esFrio);

        var factores = new List<string>
        {
            esFinde
                ? $"Base fin de semana: {f.AvgFinde:0.0}/día"
                : $"Base día de semana: {f.AvgSemana:0.0}/día"
        };

        if (es29 && f.Factor29 > UmbralFactorVisible)
            factores.Add($"Día 29 (ñoquis): ×{f.Factor29:0.0}");

        if (esFrio && f.FactorClima > UmbralFactorVisible)
            factores.Add($"Clima frío/lluvia: ×{f.FactorClima:0.0}");

        return new PrediccionProductoDto(
            f.Id,
            f.Nombre,
            Math.Round(f.PromedioDiario, 1),
            Math.Round(baseDiaTipo, 1),
            Math.Round(f.Factor29, 2),
            Math.Round(f.FactorClima, 2),
            prediccion,
            factores);
    }

    private (int total, int semana, int finde, int dia29, int frio, int normal) ContarDias(
        DateOnly desde,
        DateOnly hasta)
    {
        int total = 0, semana = 0, finde = 0, dia29 = 0, frio = 0, normal = 0;

        for (DateOnly d = desde; d <= hasta; d = d.AddDays(1))
        {
            total++;
            if (EsFinDeSemana(d.DayOfWeek)) finde++; else semana++;
            if (d.Day == 29) dia29++;
            if (clima.EsFrioOLluviosoHistorico(d)) frio++; else normal++;
        }

        return (total, semana, finde, dia29, frio, normal);
    }

    private static bool EsFinDeSemana(DayOfWeek dia) =>
        dia is DayOfWeek.Saturday or DayOfWeek.Sunday;

    private sealed record VentaRegistro(
        DateOnly Fecha,
        int VentaId,
        int ProductoId,
        string Nombre,
        int Cantidad);

    private sealed record FactoresProducto(
        int Id,
        string Nombre,
        decimal AvgSemana,
        decimal AvgFinde,
        decimal PromedioDiario,
        decimal Factor29,
        decimal FactorClima);
}

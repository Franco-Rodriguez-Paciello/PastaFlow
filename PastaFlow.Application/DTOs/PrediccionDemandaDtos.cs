namespace PastaFlow.Application.DTOs;

public sealed record PrediccionDemandaDto(
    DateOnly FechaObjetivo,
    bool EsFinDeSemana,
    bool EsDia29,
    ClimaPronosticoDto Clima,
    RangoAnalisisDemandaDto Rango,
    IReadOnlyList<PrediccionProductoDto> Productos,
    decimal TotalUnidadesPredichas,
    string? RecomendacionIa);

public sealed record ClimaPronosticoDto(
    bool Disponible,
    double? TempMaxC,
    double? PrecipMm,
    bool EsFrioOLluvioso,
    string Descripcion);

public sealed record RangoAnalisisDemandaDto(
    DateOnly Desde,
    DateOnly Hasta,
    int DiasAnalizados,
    int TotalVentas);

public sealed record PrediccionProductoDto(
    int ProductoId,
    string Nombre,
    decimal PromedioDiario,
    decimal PromedioDiaTipo,
    decimal FactorDia29,
    decimal FactorClima,
    decimal PrediccionUnidades,
    IReadOnlyList<string> Factores);

/// <summary>Resultado de un proveedor de clima para una fecha puntual.</summary>
public sealed record PronosticoDiaResult(
    bool Disponible,
    double? TempMaxC,
    double? PrecipMm,
    bool EsFrioOLluvioso,
    string Descripcion);

/// <summary>Punto de una serie temporal diaria (para gráficos de tendencia).</summary>
public sealed record SerieDiariaDto(DateOnly Fecha, decimal Unidades);

/// <summary>Métricas de validación del modelo sobre un período de prueba (holdout).</summary>
public sealed record BacktestDemandaDto(
    decimal Mape,
    decimal Precision,
    int DiasEvaluados,
    DateOnly TestDesde,
    DateOnly TestHasta,
    IReadOnlyList<PuntoBacktestDto> Serie);

public sealed record PuntoBacktestDto(DateOnly Fecha, decimal Real, decimal Predicho);

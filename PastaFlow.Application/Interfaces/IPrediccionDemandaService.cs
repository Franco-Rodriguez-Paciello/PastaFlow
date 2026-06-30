using PastaFlow.Application.DTOs;

namespace PastaFlow.Application.Interfaces;

public interface IPrediccionDemandaService
{
    /// <summary>Predicción de demanda para una fecha objetivo (incluye pronóstico real del clima).</summary>
    Task<PrediccionDemandaDto> CalcularAsync(
        DateOnly fechaObjetivo,
        CancellationToken cancellationToken = default);

    /// <summary>Valida el modelo comparando predicción vs. real sobre un período de prueba (holdout).</summary>
    Task<BacktestDemandaDto> BacktestAsync(CancellationToken cancellationToken = default);

    /// <summary>Serie diaria de unidades vendidas en los últimos N días (para gráficos).</summary>
    Task<IReadOnlyList<SerieDiariaDto>> SerieHistoricaAsync(
        int dias,
        CancellationToken cancellationToken = default);
}

using PastaFlow.Application.DTOs;

namespace PastaFlow.Application.Interfaces;

public interface IClimaProvider
{
    /// <summary>
    /// Condición climática histórica de un día (frío o lluvioso). Determinística y estable
    /// entre procesos, de modo que el predictor pueda recuperar el patrón sembrado en las ventas.
    /// </summary>
    bool EsFrioOLluviosoHistorico(DateOnly dia);

    /// <summary>
    /// Pronóstico real del clima para una fecha (vía API externa). Si la fecha está fuera del
    /// rango disponible o falla la consulta, devuelve un resultado no disponible.
    /// </summary>
    Task<PronosticoDiaResult> ObtenerPronosticoAsync(DateOnly dia, CancellationToken cancellationToken = default);
}

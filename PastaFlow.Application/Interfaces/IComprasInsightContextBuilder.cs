using PastaFlow.Application.DTOs;

namespace PastaFlow.Application.Interfaces;

/// <summary>
/// Arma el contexto estructurado (datos de BD + proyecciones determinísticas)
/// que luego se serializa a JSON y se envía al modelo de lenguaje.
/// </summary>
public interface IComprasInsightContextBuilder
{
    Task<ComprasInsightContextDto> BuildAsync(CancellationToken cancellationToken = default);
}

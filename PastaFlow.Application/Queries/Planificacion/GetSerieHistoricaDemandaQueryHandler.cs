using PastaFlow.Application.DTOs;
using PastaFlow.Application.Interfaces;

namespace PastaFlow.Application.Queries.Planificacion;

public sealed class GetSerieHistoricaDemandaQueryHandler(IPrediccionDemandaService service)
{
    public Task<IReadOnlyList<SerieDiariaDto>> HandleAsync(
        GetSerieHistoricaDemandaQuery query,
        CancellationToken cancellationToken = default) =>
        service.SerieHistoricaAsync(query.Dias, cancellationToken);
}

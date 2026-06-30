using PastaFlow.Application.DTOs;
using PastaFlow.Application.Interfaces;

namespace PastaFlow.Application.Queries.Planificacion;

public sealed class GetPrediccionDemandaQueryHandler(IPrediccionDemandaService service)
{
    public Task<PrediccionDemandaDto> HandleAsync(
        GetPrediccionDemandaQuery query,
        CancellationToken cancellationToken = default) =>
        service.CalcularAsync(query.Fecha, cancellationToken);
}

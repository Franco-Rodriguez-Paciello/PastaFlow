using PastaFlow.Application.DTOs;
using PastaFlow.Application.Interfaces;

namespace PastaFlow.Application.Queries.Planificacion;

public sealed class GetBacktestDemandaQueryHandler(IPrediccionDemandaService service)
{
    public Task<BacktestDemandaDto> HandleAsync(
        GetBacktestDemandaQuery query,
        CancellationToken cancellationToken = default) =>
        service.BacktestAsync(cancellationToken);
}

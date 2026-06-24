using Microsoft.EntityFrameworkCore;
using PastaFlow.Application.DTOs;
using PastaFlow.Application.Interfaces;

namespace PastaFlow.Application.Queries.Dashboard;

public sealed class GetComprasInsightByIdQueryHandler(IPastaFlowDbContext context)
{
    public async Task<ComprasInsightDto> HandleAsync(
        GetComprasInsightByIdQuery query,
        CancellationToken cancellationToken = default)
    {
        ComprasInsightDto? informe = await context.InformesComprasInsight
            .AsNoTracking()
            .Where(i => i.Id == query.Id)
            .Select(i => new ComprasInsightDto(
                i.Id,
                i.Reporte,
                i.GeneradoEnUtc,
                i.Origen.ToString(),
                i.DiaOperativo))
            .FirstOrDefaultAsync(cancellationToken);

        if (informe is null)
        {
            throw new KeyNotFoundException(
                $"No se encontró el informe de compras con Id {query.Id}.");
        }

        return informe;
    }
}

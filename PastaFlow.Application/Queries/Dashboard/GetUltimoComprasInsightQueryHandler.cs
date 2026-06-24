using Microsoft.EntityFrameworkCore;
using PastaFlow.Application.DTOs;
using PastaFlow.Application.Interfaces;

namespace PastaFlow.Application.Queries.Dashboard;

public sealed class GetUltimoComprasInsightQueryHandler(IPastaFlowDbContext context)
{
    public async Task<ComprasInsightDto?> HandleAsync(
        GetUltimoComprasInsightQuery query,
        CancellationToken cancellationToken = default)
    {
        return await context.InformesComprasInsight
            .AsNoTracking()
            .OrderByDescending(i => i.GeneradoEnUtc)
            .Select(i => new ComprasInsightDto(
                i.Id,
                i.Reporte,
                i.GeneradoEnUtc,
                i.Origen.ToString(),
                i.DiaOperativo))
            .FirstOrDefaultAsync(cancellationToken);
    }
}

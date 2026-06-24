using Microsoft.EntityFrameworkCore;
using PastaFlow.Application.DTOs;
using PastaFlow.Application.Interfaces;

namespace PastaFlow.Application.Queries.Dashboard;

public sealed class GetHistorialComprasInsightsQueryHandler(IPastaFlowDbContext context)
{
    private const int VistaPreviaMaxLength = 140;

    public async Task<IReadOnlyCollection<ComprasInsightResumenDto>> HandleAsync(
        GetHistorialComprasInsightsQuery query,
        CancellationToken cancellationToken = default)
    {
        int take = Math.Clamp(query.Take, 1, 50);

        var informes = await context.InformesComprasInsight
            .AsNoTracking()
            .OrderByDescending(i => i.GeneradoEnUtc)
            .Take(take)
            .Select(i => new
            {
                i.Id,
                i.GeneradoEnUtc,
                i.Origen,
                i.DiaOperativo,
                i.Reporte
            })
            .ToListAsync(cancellationToken);

        return informes
            .Select(i => new ComprasInsightResumenDto(
                i.Id,
                i.GeneradoEnUtc,
                i.Origen.ToString(),
                i.DiaOperativo,
                BuildVistaPrevia(i.Reporte)))
            .ToList();
    }

    private static string BuildVistaPrevia(string reporte)
    {
        string normalizado = reporte.ReplaceLineEndings(" ").Trim();
        if (normalizado.Length <= VistaPreviaMaxLength)
            return normalizado;

        return normalizado[..VistaPreviaMaxLength].TrimEnd() + "…";
    }
}

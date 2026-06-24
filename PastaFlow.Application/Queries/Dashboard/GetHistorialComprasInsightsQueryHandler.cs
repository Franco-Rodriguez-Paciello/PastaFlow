using Microsoft.EntityFrameworkCore;
using PastaFlow.Application.DTOs;
using PastaFlow.Application.Interfaces;

namespace PastaFlow.Application.Queries.Dashboard;

public sealed class GetHistorialComprasInsightsQueryHandler(IPastaFlowDbContext context)
{
    private const int VistaPreviaMaxLength = 140;

    public async Task<ComprasInsightsPaginadoDto> HandleAsync(
        GetHistorialComprasInsightsQuery query,
        CancellationToken cancellationToken = default)
    {
        int page = Math.Max(1, query.Page);
        int pageSize = Math.Clamp(query.PageSize, 1, 100);

        IQueryable<Domain.Entities.InformeComprasInsight> consulta =
            context.InformesComprasInsight.AsNoTracking();

        if (query.FechaDesde.HasValue)
        {
            DateTime desdeUtc = DateTime.SpecifyKind(query.FechaDesde.Value.Date, DateTimeKind.Utc);
            consulta = consulta.Where(i => i.GeneradoEnUtc >= desdeUtc);
        }

        if (query.FechaHasta.HasValue)
        {
            DateTime hastaUtc = DateTime.SpecifyKind(query.FechaHasta.Value.Date.AddDays(1), DateTimeKind.Utc);
            consulta = consulta.Where(i => i.GeneradoEnUtc < hastaUtc);
        }

        if (query.Origen.HasValue)
            consulta = consulta.Where(i => i.Origen == query.Origen.Value);

        int total = await consulta.CountAsync(cancellationToken);

        var informes = await consulta
            .OrderByDescending(i => i.GeneradoEnUtc)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(i => new
            {
                i.Id,
                i.GeneradoEnUtc,
                i.Origen,
                i.DiaOperativo,
                i.Reporte
            })
            .ToListAsync(cancellationToken);

        var items = informes
            .Select(i => new ComprasInsightResumenDto(
                i.Id,
                i.GeneradoEnUtc,
                i.Origen.ToString(),
                i.DiaOperativo,
                BuildVistaPrevia(i.Reporte)))
            .ToList();

        return new ComprasInsightsPaginadoDto(items, total, page, pageSize);
    }

    private static string BuildVistaPrevia(string reporte)
    {
        string normalizado = reporte.ReplaceLineEndings(" ").Trim();
        if (normalizado.Length <= VistaPreviaMaxLength)
            return normalizado;

        return normalizado[..VistaPreviaMaxLength].TrimEnd() + "…";
    }
}

using Microsoft.EntityFrameworkCore;
using PastaFlow.Application.DTOs;
using PastaFlow.Application.Interfaces;

namespace PastaFlow.Application.Queries.Produccion;

public sealed class GetHistorialProduccionQueryHandler
{
    private readonly IPastaFlowDbContext _context;

    public GetHistorialProduccionQueryHandler(IPastaFlowDbContext context)
    {
        _context = context;
    }

    public async Task<IReadOnlyCollection<HistorialProduccionDto>> HandleAsync(
        GetHistorialProduccionQuery query,
        CancellationToken cancellationToken = default)
    {
        var q = _context.HistorialProduccion
            .AsNoTracking()
            .Include(h => h.Producto)
            .AsQueryable();

        if (query.ProductoId.HasValue)
            q = q.Where(h => h.ProductoId == query.ProductoId.Value);

        if (query.FechaDesde.HasValue)
            q = q.Where(h => h.FechaDeRegistro >= query.FechaDesde.Value.ToUniversalTime());

        if (query.FechaHasta.HasValue)
            q = q.Where(h => h.FechaDeRegistro <= query.FechaHasta.Value.Date.AddDays(1).AddTicks(-1).ToUniversalTime());

        return await q
            .OrderByDescending(h => h.FechaDeRegistro)
            .Select(h => new HistorialProduccionDto(
                h.Id,
                h.ProductoId,
                h.Producto.Nombre,
                h.CantidadProducida,
                h.FechaDeRegistro))
            .ToListAsync(cancellationToken);
    }
}

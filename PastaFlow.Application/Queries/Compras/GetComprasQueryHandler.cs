using Microsoft.EntityFrameworkCore;
using PastaFlow.Application.DTOs;
using PastaFlow.Application.Interfaces;

namespace PastaFlow.Application.Queries.Compras;

public sealed class GetComprasQueryHandler(IPastaFlowDbContext context)
{
    public async Task<IReadOnlyCollection<CompraResumenDto>> HandleAsync(
        GetComprasQuery query,
        CancellationToken cancellationToken = default)
    {
        IQueryable<Domain.Entities.Compra> q = context.Compras
            .AsNoTracking()
            .Include(c => c.Proveedor)
            .Include(c => c.Lineas);

        if (query.FechaDesde.HasValue)
            q = q.Where(c => c.FechaIngreso >= query.FechaDesde.Value.ToUniversalTime());

        if (query.FechaHasta.HasValue)
            q = q.Where(c => c.FechaIngreso <= query.FechaHasta.Value.Date.AddDays(1).AddTicks(-1).ToUniversalTime());

        if (query.ProveedorId.HasValue)
            q = q.Where(c => c.ProveedorId == query.ProveedorId.Value);

        return await q
            .OrderByDescending(c => c.FechaIngreso)
            .Select(c => new CompraResumenDto(
                c.Id,
                c.FechaIngreso,
                c.Proveedor != null ? c.Proveedor.Nombre : null,
                c.NumeroFactura,
                c.Lineas.Count,
                c.Total))
            .ToListAsync(cancellationToken);
    }
}

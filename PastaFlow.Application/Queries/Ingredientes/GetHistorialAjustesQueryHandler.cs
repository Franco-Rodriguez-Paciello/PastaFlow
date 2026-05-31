using Microsoft.EntityFrameworkCore;
using PastaFlow.Application.DTOs;
using PastaFlow.Application.Interfaces;

namespace PastaFlow.Application.Queries.Ingredientes;

public sealed class GetHistorialAjustesQueryHandler
{
    private readonly IPastaFlowDbContext _context;

    public GetHistorialAjustesQueryHandler(IPastaFlowDbContext context)
    {
        _context = context;
    }

    public async Task<IReadOnlyCollection<AjusteStockDto>> HandleAsync(
        GetHistorialAjustesQuery query,
        CancellationToken cancellationToken = default)
    {
        var q = _context.AjustesStock
            .AsNoTracking()
            .Include(a => a.Insumo)
            .AsQueryable();

        if (query.InsumoId.HasValue)
            q = q.Where(a => a.InsumoId == query.InsumoId.Value);

        return await q
            .OrderByDescending(a => a.FechaRegistro)
            .Take(query.Take)
            .Select(a => new AjusteStockDto(
                a.Id,
                a.FechaRegistro,
                a.InsumoId,
                a.Insumo.Nombre,
                a.TipoAjuste.ToString(),
                a.Motivo.ToString(),
                a.Cantidad,
                a.Observaciones))
            .ToListAsync(cancellationToken);
    }
}

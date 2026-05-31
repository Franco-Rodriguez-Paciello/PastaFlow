using Microsoft.EntityFrameworkCore;
using PastaFlow.Application.DTOs;
using PastaFlow.Application.Interfaces;

namespace PastaFlow.Application.Queries.Productos;

public sealed class GetRecetaByProductoQueryHandler
{
    private readonly IPastaFlowDbContext _context;

    public GetRecetaByProductoQueryHandler(IPastaFlowDbContext context)
    {
        _context = context;
    }

    public async Task<IReadOnlyCollection<RecetaItemDto>> HandleAsync(
        GetRecetaByProductoQuery query,
        CancellationToken cancellationToken = default)
    {
        List<RecetaItemDto> items = await _context.RecetaIngredientes
            .AsNoTracking()
            .Where(ri => ri.ProductoId == query.ProductoId)
            .Include(ri => ri.Ingrediente)
            .Select(ri => new RecetaItemDto(
                ri.IngredienteId,
                ri.Ingrediente.Nombre,
                ri.Ingrediente.CostoActual,
                ri.Ingrediente.UnidadMedida.ToString(),
                ri.CantidadRequerida))
            .ToListAsync(cancellationToken);

        return items;
    }
}

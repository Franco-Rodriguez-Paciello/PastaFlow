using Microsoft.EntityFrameworkCore;
using PastaFlow.Application.DTOs;
using PastaFlow.Application.Interfaces;

namespace PastaFlow.Application.Queries.Productos;

public sealed class GetProductosQueryHandler
{
    private readonly IPastaFlowDbContext _context;

    public GetProductosQueryHandler(IPastaFlowDbContext context)
    {
        _context = context;
    }

    public async Task<IReadOnlyCollection<ProductoDto>> HandleAsync(
        GetProductosQuery query,
        CancellationToken cancellationToken = default)
    {
        // AsNoTracking: sin overhead del Change Tracker en operaciones de solo lectura.
        // Select con navegación anidada: EF Core genera un JOIN con RecetaIngrediente
        // e Ingrediente sin necesidad de .Include() explícito, trayendo solo las
        // columnas necesarias para el DTO.
        return await _context.Productos
            .AsNoTracking()
            .OrderBy(p => p.Nombre)
            .Select(p => new ProductoDto(
                p.Id,
                p.Nombre,
                p.Descripcion,
                p.PrecioVenta,
                p.StockActual,
                p.TipoProducto.ToString(),
                p.ActivoParaTiendaOnline,
                p.Receta
                    .OrderBy(ri => ri.Ingrediente.Nombre)
                    .Select(ri => new RecetaIngredienteDto(
                        ri.IngredienteId,
                        ri.Ingrediente.Nombre,
                        ri.CantidadRequerida,
                        ri.Ingrediente.UnidadMedida.ToString()))
                    .ToList()))
            .ToListAsync(cancellationToken);
    }
}

using Microsoft.EntityFrameworkCore;
using PastaFlow.Application.DTOs;
using PastaFlow.Application.Interfaces;
using PastaFlow.Domain.Entities;

namespace PastaFlow.Application.Queries.Productos;

public sealed class GetProductProfitabilityQueryHandler
{
    private readonly IPastaFlowDbContext _context;

    public GetProductProfitabilityQueryHandler(IPastaFlowDbContext context)
    {
        _context = context;
    }

    public async Task<IReadOnlyCollection<ProductProfitabilityDto>> HandleAsync(
        GetProductProfitabilityQuery query,
        CancellationToken cancellationToken = default)
    {
        // Solo los productos compuestos tienen receta con costo calculable.
        // Include + ThenInclude carga el grafo completo en una única consulta SQL
        // con JOINs generados por EF Core.
        List<Producto> productos = await _context.Productos
            .AsNoTracking()
            .Where(p => p.TipoProducto == TipoProducto.Compuesto)
            .Include(p => p.Receta)
                .ThenInclude(ri => ri.Ingrediente)
            .OrderBy(p => p.Nombre)
            .ToListAsync(cancellationToken);

        // El cálculo de CostoTotal y Margen se realiza en memoria:
        // al tener el grafo completo cargado, evitamos llamadas adicionales a la DB.
        return productos
            .Select(p =>
            {
                decimal costoTotal = p.Receta
                    .Sum(ri => ri.CantidadRequerida * ri.Ingrediente.CostoActual);

                return new ProductProfitabilityDto(
                    p.Id,
                    p.Nombre,
                    p.PrecioVenta,
                    CostoTotal: costoTotal,
                    Margen: p.PrecioVenta - costoTotal);
            })
            .ToList();
    }
}

using Microsoft.EntityFrameworkCore;
using PastaFlow.Application.DTOs;
using PastaFlow.Application.Interfaces;

namespace PastaFlow.Application.Queries.Compras;

public sealed class GetCompraByIdQueryHandler(IPastaFlowDbContext context)
{
    public async Task<CompraDetalleDto> HandleAsync(
        GetCompraByIdQuery query,
        CancellationToken cancellationToken = default)
    {
        CompraDetalleDto? compra = await context.Compras
            .AsNoTracking()
            .Include(c => c.Proveedor)
            .Include(c => c.Lineas)
                .ThenInclude(l => l.Ingrediente)
            .Where(c => c.Id == query.Id)
            .Select(c => new CompraDetalleDto(
                c.Id,
                c.FechaIngreso,
                c.ProveedorId,
                c.Proveedor != null ? c.Proveedor.Nombre : null,
                c.NumeroFactura,
                c.Observaciones,
                c.Total,
                c.Lineas
                    .OrderBy(l => l.Ingrediente.Nombre)
                    .Select(l => new CompraLineaDto(
                        l.IngredienteId,
                        l.Ingrediente.Nombre,
                        l.Ingrediente.UnidadMedida.ToString(),
                        l.Cantidad,
                        l.PrecioUnitario,
                        l.Subtotal))
                    .ToList()))
            .FirstOrDefaultAsync(cancellationToken);

        if (compra is null)
            throw new KeyNotFoundException($"No se encontró la compra con Id {query.Id}.");

        return compra;
    }
}

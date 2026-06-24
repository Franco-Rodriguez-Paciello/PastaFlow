using Microsoft.EntityFrameworkCore;
using PastaFlow.Application.DTOs;
using PastaFlow.Application.Interfaces;

namespace PastaFlow.Application.Queries.Proveedores;

public sealed class GetProveedoresQueryHandler(IPastaFlowDbContext context)
{
    public async Task<IReadOnlyCollection<ProveedorDto>> HandleAsync(
        GetProveedoresQuery query,
        CancellationToken cancellationToken = default)
    {
        return await context.Proveedores
            .AsNoTracking()
            .OrderBy(p => p.Nombre)
            .Select(p => new ProveedorDto(
                p.Id,
                p.Nombre,
                p.ContactoNombre,
                p.Telefono,
                p.Email,
                p.Cuit,
                p.Notas,
                p.Activo,
                p.Ingredientes
                    .OrderBy(pi => pi.Ingrediente.Nombre)
                    .Select(pi => new ProveedorIngredienteDto(
                        pi.IngredienteId,
                        pi.Ingrediente.Nombre,
                        pi.Ingrediente.UnidadMedida.ToString(),
                        pi.CodigoProveedor,
                        pi.PrecioReferencia,
                        pi.EsPreferido,
                        pi.TiempoEntregaDias))
                    .ToList()))
            .ToListAsync(cancellationToken);
    }
}

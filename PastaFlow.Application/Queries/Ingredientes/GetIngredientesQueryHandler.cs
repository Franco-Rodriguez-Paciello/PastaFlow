using Microsoft.EntityFrameworkCore;
using PastaFlow.Application.DTOs;
using PastaFlow.Application.Interfaces;

namespace PastaFlow.Application.Queries.Ingredientes;

public sealed class GetIngredientesQueryHandler
{
    private readonly IPastaFlowDbContext _context;

    public GetIngredientesQueryHandler(IPastaFlowDbContext context)
    {
        _context = context;
    }

    public async Task<IReadOnlyCollection<IngredienteDto>> HandleAsync(
        GetIngredientesQuery query,
        CancellationToken cancellationToken = default)
    {
        // AsNoTracking: EF Core no registra las entidades en el Change Tracker,
        // reduciendo memoria y overhead en operaciones de solo lectura.
        // Select: EF Core traduce la proyección a un SELECT con las columnas
        // exactas del DTO, sin traer columnas innecesarias de la base de datos.
        return await _context.Ingredientes
            .AsNoTracking()
            .OrderBy(i => i.Nombre)
            .Select(i => new IngredienteDto(
                i.Id,
                i.Nombre,
                i.UnidadMedida.ToString(),
                i.CostoActual,
                i.StockActual,
                i.UltimaActualizacionCosto))
            .ToListAsync(cancellationToken);
    }
}

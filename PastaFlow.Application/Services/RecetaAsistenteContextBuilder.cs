using Microsoft.EntityFrameworkCore;
using PastaFlow.Application.DTOs;
using PastaFlow.Application.Interfaces;

namespace PastaFlow.Application.Services;

public sealed class RecetaAsistenteContextBuilder(IPastaFlowDbContext context) : IRecetaAsistenteContextBuilder
{
    public async Task<RecetaAsistenteContextDto> BuildAsync(CancellationToken cancellationToken = default)
    {
        var insumos = await context.Ingredientes
            .AsNoTracking()
            .OrderBy(i => i.Nombre)
            .Select(i => new InsumoCatalogoContextDto(
                i.Id,
                i.Nombre,
                i.UnidadMedida.ToString(),
                i.CostoActual,
                i.StockActual))
            .ToListAsync(cancellationToken);

        return new RecetaAsistenteContextDto(insumos);
    }
}

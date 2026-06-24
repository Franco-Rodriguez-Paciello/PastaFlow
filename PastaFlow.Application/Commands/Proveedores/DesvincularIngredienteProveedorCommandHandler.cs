using Microsoft.EntityFrameworkCore;
using PastaFlow.Application.Interfaces;

namespace PastaFlow.Application.Commands.Proveedores;

public sealed class DesvincularIngredienteProveedorCommandHandler(IPastaFlowDbContext context)
{
    public async Task HandleAsync(
        DesvincularIngredienteProveedorCommand command,
        CancellationToken cancellationToken = default)
    {
        var vinculo = await context.ProveedorIngredientes
            .FirstOrDefaultAsync(
                pi => pi.ProveedorId == command.ProveedorId && pi.IngredienteId == command.IngredienteId,
                cancellationToken)
            ?? throw new KeyNotFoundException(
                $"No existe vínculo entre proveedor {command.ProveedorId} e ingrediente {command.IngredienteId}.");

        context.ProveedorIngredientes.Remove(vinculo);
        await context.SaveChangesAsync(cancellationToken);
    }
}

using Microsoft.EntityFrameworkCore;
using PastaFlow.Application.Interfaces;
using PastaFlow.Domain.Entities;

namespace PastaFlow.Application.Commands.Proveedores;

public sealed class VincularIngredienteProveedorCommandHandler(IPastaFlowDbContext context)
{
    public async Task HandleAsync(
        VincularIngredienteProveedorCommand command,
        CancellationToken cancellationToken = default)
    {
        bool proveedorExiste = await context.Proveedores
            .AnyAsync(p => p.Id == command.ProveedorId, cancellationToken);

        if (!proveedorExiste)
            throw new KeyNotFoundException($"Proveedor con id {command.ProveedorId} no encontrado.");

        bool ingredienteExiste = await context.Ingredientes
            .AnyAsync(i => i.Id == command.IngredienteId, cancellationToken);

        if (!ingredienteExiste)
            throw new KeyNotFoundException($"Ingrediente con id {command.IngredienteId} no encontrado.");

        var vinculoExistente = await context.ProveedorIngredientes
            .FirstOrDefaultAsync(
                pi => pi.ProveedorId == command.ProveedorId && pi.IngredienteId == command.IngredienteId,
                cancellationToken);

        if (vinculoExistente is not null)
        {
            if (command.EsPreferido && !vinculoExistente.EsPreferido)
            {
                await UnsetPreferredForIngredienteAsync(command.IngredienteId, cancellationToken);
            }

            vinculoExistente.Actualizar(
                command.PrecioReferencia,
                command.CodigoProveedor,
                command.EsPreferido,
                command.TiempoEntregaDias);
        }
        else
        {
            if (command.EsPreferido)
            {
                await UnsetPreferredForIngredienteAsync(command.IngredienteId, cancellationToken);
            }

            context.ProveedorIngredientes.Add(new ProveedorIngrediente(
                command.ProveedorId,
                command.IngredienteId,
                command.PrecioReferencia,
                command.CodigoProveedor,
                command.EsPreferido,
                command.TiempoEntregaDias));
        }

        await context.SaveChangesAsync(cancellationToken);
    }

    private async Task UnsetPreferredForIngredienteAsync(int ingredienteId, CancellationToken cancellationToken)
    {
        await context.ProveedorIngredientes
            .Where(pi => pi.IngredienteId == ingredienteId && pi.EsPreferido)
            .ExecuteUpdateAsync(
                s => s.SetProperty(pi => pi.EsPreferido, false),
                cancellationToken);
    }
}

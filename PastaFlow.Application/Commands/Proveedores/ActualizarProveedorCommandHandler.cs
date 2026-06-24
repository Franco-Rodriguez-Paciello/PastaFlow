using Microsoft.EntityFrameworkCore;
using PastaFlow.Application.Interfaces;

namespace PastaFlow.Application.Commands.Proveedores;

public sealed class ActualizarProveedorCommandHandler(IPastaFlowDbContext context)
{
    public async Task HandleAsync(
        ActualizarProveedorCommand command,
        CancellationToken cancellationToken = default)
    {
        var proveedor = await context.Proveedores
            .FirstOrDefaultAsync(p => p.Id == command.Id, cancellationToken)
            ?? throw new KeyNotFoundException($"Proveedor con id {command.Id} no encontrado.");

        string nombreNormalizado = command.Nombre.Trim();

        bool nombreDuplicado = await context.Proveedores
            .AnyAsync(p => p.Id != command.Id && p.Nombre == nombreNormalizado, cancellationToken);

        if (nombreDuplicado)
            throw new InvalidOperationException(
                $"Ya existe otro proveedor con el nombre '{nombreNormalizado}'.");

        proveedor.Actualizar(
            nombreNormalizado,
            command.ContactoNombre,
            command.Telefono,
            command.Email,
            command.Cuit,
            command.Notas,
            command.Activo);

        await context.SaveChangesAsync(cancellationToken);
    }
}

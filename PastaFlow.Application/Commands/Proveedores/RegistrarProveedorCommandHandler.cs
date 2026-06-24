using Microsoft.EntityFrameworkCore;
using PastaFlow.Application.Interfaces;
using PastaFlow.Domain.Entities;

namespace PastaFlow.Application.Commands.Proveedores;

public sealed class RegistrarProveedorCommandHandler(IPastaFlowDbContext context)
{
    public async Task<int> HandleAsync(
        RegistrarProveedorCommand command,
        CancellationToken cancellationToken = default)
    {
        string nombreNormalizado = command.Nombre.Trim();

        bool nombreExiste = await context.Proveedores
            .AnyAsync(p => p.Nombre == nombreNormalizado, cancellationToken);

        if (nombreExiste)
            throw new InvalidOperationException(
                $"Ya existe un proveedor con el nombre '{nombreNormalizado}'.");

        var proveedor = new Proveedor(
            nombreNormalizado,
            command.ContactoNombre,
            command.Telefono,
            command.Email,
            command.Cuit,
            command.Notas);

        context.Proveedores.Add(proveedor);
        await context.SaveChangesAsync(cancellationToken);

        return proveedor.Id;
    }
}

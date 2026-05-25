using Microsoft.EntityFrameworkCore;
using PastaFlow.Application.Interfaces;
using PastaFlow.Domain.Entities;

namespace PastaFlow.Application.Commands.Productos;

public sealed class RegistrarProductoCommandHandler
{
    private readonly IPastaFlowDbContext _context;

    public RegistrarProductoCommandHandler(IPastaFlowDbContext context)
    {
        _context = context;
    }

    public async Task<int> HandleAsync(
        RegistrarProductoCommand command,
        CancellationToken cancellationToken = default)
    {
        // 1. Validar unicidad de nombre
        bool nombreExiste = await _context.Productos
            .AnyAsync(p => p.Nombre == command.Nombre, cancellationToken);

        if (nombreExiste)
            throw new InvalidOperationException(
                $"Ya existe un producto con el nombre '{command.Nombre}'.");

        // 2. Instanciar a través del constructor público (activa validaciones de dominio)
        var producto = new Producto(
            command.Nombre,
            command.Descripcion,
            command.PrecioVenta,
            command.TipoProducto);

        _context.Productos.Add(producto);

        // 3. Único SaveChanges: INSERT en la misma transacción implícita
        await _context.SaveChangesAsync(cancellationToken);

        return producto.Id;
    }
}

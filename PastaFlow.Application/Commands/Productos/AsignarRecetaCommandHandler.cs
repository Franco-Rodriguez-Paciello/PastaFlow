using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Storage;
using PastaFlow.Application.Interfaces;
using PastaFlow.Domain.Entities;

namespace PastaFlow.Application.Commands.Productos;

public sealed class AsignarRecetaCommandHandler
{
    private readonly IPastaFlowDbContext _context;

    public AsignarRecetaCommandHandler(IPastaFlowDbContext context)
    {
        _context = context;
    }

    public async Task HandleAsync(
        AsignarRecetaCommand command,
        CancellationToken cancellationToken = default)
    {
        await using IDbContextTransaction tx =
            await _context.BeginTransactionAsync(cancellationToken);

        try
        {
            // 1. Cargar el producto con su receta actual
            Producto? producto = await _context.Productos
                .Include(p => p.Receta)
                .FirstOrDefaultAsync(p => p.Id == command.ProductoId, cancellationToken);

            if (producto is null)
                throw new KeyNotFoundException(
                    $"No se encontró un producto con el ID '{command.ProductoId}'.");

            // 2. Eliminar ingredientes previos de la receta
            _context.RecetaIngredientes.RemoveRange(producto.Receta);

            // 3. Insertar los nuevos ingredientes
            foreach (IngredienteRecetaInput input in command.Ingredientes)
            {
                _context.RecetaIngredientes.Add(new RecetaIngrediente(
                    command.ProductoId,
                    input.IngredienteId,
                    input.CantidadRequerida));
            }

            // 4. Si era Simple, promoverlo automáticamente a Compuesto
            if (producto.TipoProducto == TipoProducto.Simple)
                producto.ConvertirACompuesto();

            // 5. Persistir todo en una única operación y confirmar la transacción
            await _context.SaveChangesAsync(cancellationToken);
            await tx.CommitAsync(cancellationToken);
        }
        catch
        {
            await tx.RollbackAsync(cancellationToken);
            throw;
        }
    }
}

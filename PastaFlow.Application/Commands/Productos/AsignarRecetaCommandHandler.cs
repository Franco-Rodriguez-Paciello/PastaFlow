using Microsoft.EntityFrameworkCore;
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
        // 1. Cargar el producto con su receta actual (necesaria para la limpieza)
        Producto? producto = await _context.Productos
            .Include(p => p.Receta)
            .FirstOrDefaultAsync(p => p.Id == command.ProductoId, cancellationToken);

        if (producto is null)
            throw new KeyNotFoundException(
                $"No se encontró un producto con el ID '{command.ProductoId}'.");

        // 2. Regla de negocio: los productos simples no tienen receta
        if (producto.TipoProducto == TipoProducto.Simple)
            throw new InvalidOperationException(
                "No se puede asignar una receta a un producto simple.");

        // 3. Sobreescribir la receta: eliminar los ingredientes previos del contexto
        //    (Receta es IReadOnlyCollection, la mutación se hace a través del DbSet)
        _context.RecetaIngredientes.RemoveRange(producto.Receta);

        // 4. Instanciar y agregar cada línea de receta nueva
        //    El constructor de RecetaIngrediente valida que productoId, ingredienteId
        //    y cantidadRequerida sean mayores que cero.
        foreach (IngredienteRecetaInput input in command.Ingredientes)
        {
            var recetaIngrediente = new RecetaIngrediente(
                command.ProductoId,
                input.IngredienteId,
                input.CantidadRequerida);

            _context.RecetaIngredientes.Add(recetaIngrediente);
        }

        // 5. Única operación de escritura: DELETEs + INSERTs en la misma transacción implícita
        await _context.SaveChangesAsync(cancellationToken);
    }
}

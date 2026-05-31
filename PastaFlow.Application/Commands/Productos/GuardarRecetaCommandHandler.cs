using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Storage;
using PastaFlow.Application.Interfaces;
using PastaFlow.Domain.Entities;

namespace PastaFlow.Application.Commands.Productos;

public sealed class GuardarRecetaCommandHandler
{
    private readonly IPastaFlowDbContext _context;

    public GuardarRecetaCommandHandler(IPastaFlowDbContext context)
    {
        _context = context;
    }

    public async Task<int> HandleAsync(
        GuardarRecetaCommand command,
        CancellationToken cancellationToken = default)
    {
        await using IDbContextTransaction tx =
            await _context.BeginTransactionAsync(cancellationToken);

        try
        {
            int productoId;

            if (command.EsProductoNuevo)
            {
                if (command.DatosNuevoProducto is null)
                    throw new ArgumentException(
                        "Se requieren los datos del nuevo producto cuando 'EsProductoNuevo' es verdadero.");

                var nuevoProducto = new Producto(
                    command.DatosNuevoProducto.Nombre,
                    command.DatosNuevoProducto.Descripcion,
                    command.DatosNuevoProducto.PrecioVenta,
                    TipoProducto.Compuesto);

                nuevoProducto.ActualizarActivoParaTiendaOnline(
                    command.DatosNuevoProducto.ActivoParaTiendaOnline);

                _context.Productos.Add(nuevoProducto);

                // Primer SaveChanges para capturar el ID autogenerado por la BD
                await _context.SaveChangesAsync(cancellationToken);

                productoId = nuevoProducto.Id;
            }
            else
            {
                if (command.ProductoId is null)
                    throw new ArgumentException(
                        "Se requiere el ID del producto existente cuando 'EsProductoNuevo' es falso.");

                Producto? producto = await _context.Productos
                    .Include(p => p.Receta)
                    .FirstOrDefaultAsync(p => p.Id == command.ProductoId, cancellationToken);

                if (producto is null)
                    throw new KeyNotFoundException(
                        $"No se encontró un producto con el ID '{command.ProductoId}'.");

                // Promover a Compuesto si aún es Simple
                if (producto.TipoProducto == TipoProducto.Simple)
                    producto.ConvertirACompuesto();

                // Sobrescritura limpia: eliminar la receta existente
                _context.RecetaIngredientes.RemoveRange(producto.Receta);

                productoId = producto.Id;
            }

            // Insertar los nuevos ítems de la receta
            foreach (IngredienteRecetaInput input in command.Ingredientes)
            {
                _context.RecetaIngredientes.Add(new RecetaIngrediente(
                    productoId,
                    input.IngredienteId,
                    input.CantidadRequerida));
            }

            await _context.SaveChangesAsync(cancellationToken);
            await tx.CommitAsync(cancellationToken);

            return productoId;
        }
        catch
        {
            await tx.RollbackAsync(cancellationToken);
            throw;
        }
    }
}

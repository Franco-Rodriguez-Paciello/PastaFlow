using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using PastaFlow.Application.Interfaces;
using PastaFlow.Domain.Entities;

namespace PastaFlow.Application.Commands.Produccion;

public sealed class RegistrarProduccionCommandHandler
{
    private readonly IPastaFlowDbContext _context;
    private readonly ILogger<RegistrarProduccionCommandHandler> _logger;

    public RegistrarProduccionCommandHandler(
        IPastaFlowDbContext context,
        ILogger<RegistrarProduccionCommandHandler> logger)
    {
        _context = context;
        _logger = logger;
    }

    public async Task<int> HandleAsync(
        RegistrarProduccionCommand command,
        CancellationToken cancellationToken = default)
    {
        ArgumentOutOfRangeException.ThrowIfNegativeOrZero(command.ProductoId,
            nameof(command.ProductoId));
        ArgumentOutOfRangeException.ThrowIfNegativeOrZero(command.CantidadProducida,
            nameof(command.CantidadProducida));

        await using var transaction =
            await _context.BeginTransactionAsync(cancellationToken);

        try
        {
            // 1. Buscar el producto y validar que sea de tipo Compuesto
            Producto? producto = await _context.Productos
                .FirstOrDefaultAsync(p => p.Id == command.ProductoId, cancellationToken);

            if (producto is null)
                throw new KeyNotFoundException(
                    $"No se encontró el producto con Id {command.ProductoId}.");

            if (producto.TipoProducto != TipoProducto.Compuesto)
                throw new InvalidOperationException(
                    $"El producto '{producto.Nombre}' (Id {command.ProductoId}) no es de tipo Compuesto. " +
                    "Solo se puede registrar producción para productos compuestos.");

            // 2. Obtener todos los insumos de la receta de este producto
            List<RecetaIngrediente> receta = await _context.RecetaIngredientes
                .Where(r => r.ProductoId == command.ProductoId)
                .ToListAsync(cancellationToken);

            if (receta.Count == 0)
                throw new InvalidOperationException(
                    $"El producto '{producto.Nombre}' no tiene ningún insumo asignado en su receta.");

            // 3. Descontar stock de cada insumo (modo permisivo: permite negativos)
            foreach (RecetaIngrediente item in receta)
            {
                Ingrediente? ingrediente = await _context.Ingredientes
                    .FirstOrDefaultAsync(i => i.Id == item.IngredienteId, cancellationToken);

                if (ingrediente is null)
                {
                    _logger.LogWarning(
                        "Insumo con Id {IngredienteId} referenciado en la receta del producto {ProductoId} no existe en la base de datos.",
                        item.IngredienteId, command.ProductoId);
                    continue;
                }

                decimal cantidadADescontar = item.CantidadRequerida * command.CantidadProducida;
                decimal stockAntes = ingrediente.StockActual;

                ingrediente.DescontarStock(cantidadADescontar);

                if (ingrediente.StockActual < 0)
                {
                    _logger.LogWarning(
                        "Stock insuficiente para el insumo '{Nombre}' (Id {IngredienteId}): " +
                        "stock antes={StockAntes}, descontado={Descontado}, stock resultante={StockResultante}.",
                        ingrediente.Nombre, ingrediente.Id,
                        stockAntes, cantidadADescontar, ingrediente.StockActual);
                }
            }

            // 4. Aumentar el stock del producto terminado
            producto.AumentarStock(command.CantidadProducida);

            // 5. Registrar en el historial de producción
            var registro = new HistorialProduccion(command.ProductoId, command.CantidadProducida);
            _context.HistorialProduccion.Add(registro);

            // 6. Persistir y confirmar la transacción
            await _context.SaveChangesAsync(cancellationToken);
            await transaction.CommitAsync(cancellationToken);

            _logger.LogInformation(
                "Producción registrada correctamente. Producto: '{Nombre}' (Id {ProductoId}), " +
                "Cantidad producida: {Cantidad}. HistorialProduccionId: {RegistroId}.",
                producto.Nombre, command.ProductoId, command.CantidadProducida, registro.Id);

            return registro.Id;
        }
        catch
        {
            await transaction.RollbackAsync(cancellationToken);
            throw;
        }
    }
}

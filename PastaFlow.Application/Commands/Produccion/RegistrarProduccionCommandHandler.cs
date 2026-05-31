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

            // 3. Cargar todos los insumos de la receta de una sola vez
            List<int> idsInsumos = receta.Select(r => r.IngredienteId).ToList();
            List<Ingrediente> insumos = await _context.Ingredientes
                .Where(i => idsInsumos.Contains(i.Id))
                .ToListAsync(cancellationToken);

            // 4. Validar stock suficiente para TODOS los insumos antes de mutar ninguno
            foreach (RecetaIngrediente item in receta)
            {
                Ingrediente? ingrediente = insumos.FirstOrDefault(i => i.Id == item.IngredienteId);

                if (ingrediente is null)
                    throw new InvalidOperationException(
                        $"El insumo con Id {item.IngredienteId} referenciado en la receta del producto '{producto.Nombre}' no existe en la base de datos.");

                decimal cantidadADescontar = item.CantidadRequerida * command.CantidadProducida;

                if (ingrediente.StockActual < cantidadADescontar)
                    throw new InvalidOperationException(
                        $"Stock insuficiente de '{ingrediente.Nombre}' para realizar la producción. " +
                        $"Stock disponible: {ingrediente.StockActual}, requerido: {cantidadADescontar}.");
            }

            // 5. Descontar stock de cada insumo (validación superada, stock garantizado)
            foreach (RecetaIngrediente item in receta)
            {
                Ingrediente ingrediente = insumos.First(i => i.Id == item.IngredienteId);
                decimal cantidadADescontar = item.CantidadRequerida * command.CantidadProducida;
                ingrediente.DescontarStock(cantidadADescontar);
            }

            // 6. Aumentar el stock del producto terminado
            producto.AumentarStock(command.CantidadProducida);

            // 7. Registrar en el historial de producción
            var registro = new HistorialProduccion(command.ProductoId, command.CantidadProducida);
            _context.HistorialProduccion.Add(registro);

            // 8. Persistir y confirmar la transacción
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

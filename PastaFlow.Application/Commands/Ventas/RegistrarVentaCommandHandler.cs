using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using PastaFlow.Application.DTOs;
using PastaFlow.Application.Interfaces;
using PastaFlow.Domain.Entities;

namespace PastaFlow.Application.Commands.Ventas;

public sealed class RegistrarVentaCommandHandler
{
    private readonly IPastaFlowDbContext _context;
    private readonly ILogger<RegistrarVentaCommandHandler> _logger;

    public RegistrarVentaCommandHandler(
        IPastaFlowDbContext context,
        ILogger<RegistrarVentaCommandHandler> logger)
    {
        _context = context;
        _logger = logger;
    }

    public async Task<VentaRegistradaDto> HandleAsync(
        RegistrarVentaCommand command,
        CancellationToken cancellationToken = default)
    {
        await using var transaction =
            await _context.BeginTransactionAsync(cancellationToken);

        try
        {
            // 1. Cargar todos los productos involucrados en la venta en un único viaje a BD
            var idsProductos = command.Items.Select(i => i.ProductoId).Distinct().ToList();
            var productos = await _context.Productos
                .Where(p => idsProductos.Contains(p.Id))
                .ToListAsync(cancellationToken);

            // 2. Verificar que todos los productos solicitados existen
            foreach (var item in command.Items)
            {
                if (!productos.Any(p => p.Id == item.ProductoId))
                    throw new KeyNotFoundException(
                        $"No se encontró el producto con Id {item.ProductoId}.");
            }

            // 3. Validar stock suficiente para TODOS los ítems antes de mutar ninguno (fail-fast)
            foreach (var item in command.Items)
            {
                var producto = productos.First(p => p.Id == item.ProductoId);
                if (producto.StockActual < item.Cantidad)
                    throw new InvalidOperationException(
                        $"Stock insuficiente para '{producto.Nombre}'. " +
                        $"Stock disponible: {producto.StockActual}, solicitado: {item.Cantidad}.");
            }

            // 4. Construir los detalles y descontar stock (los totales se calculan en el backend)
            var detalles = new List<DetalleVenta>();
            foreach (var item in command.Items)
            {
                var producto = productos.First(p => p.Id == item.ProductoId);
                producto.RestarStock(item.Cantidad);
                detalles.Add(new DetalleVenta(item.ProductoId, item.Cantidad, producto.PrecioVenta));
            }

            // 5. Crear la venta con el total calculado en el backend
            var venta = new Venta(command.UsuarioId, command.MetodoPago, detalles);

            await _context.Ventas.AddAsync(venta, cancellationToken);
            await _context.SaveChangesAsync(cancellationToken);
            await transaction.CommitAsync(cancellationToken);

            _logger.LogInformation(
                "Venta {VentaId} registrada por usuario {UsuarioId}. Total: {Total} ({MetodoPago})",
                venta.Id, command.UsuarioId, venta.Total, command.MetodoPago);

            // 6. Proyectar respuesta
            var productosDict = productos.ToDictionary(p => p.Id, p => p.Nombre);
            var detallesDto = venta.Detalles
                .Select(d => new DetalleVentaDto(
                    d.ProductoId,
                    productosDict.GetValueOrDefault(d.ProductoId, "Desconocido"),
                    d.Cantidad,
                    d.PrecioUnitario,
                    d.Subtotal))
                .ToList();

            return new VentaRegistradaDto(venta.Id, venta.Fecha, venta.Total, venta.MetodoPago, detallesDto);
        }
        catch
        {
            await transaction.RollbackAsync(cancellationToken);
            throw;
        }
    }
}

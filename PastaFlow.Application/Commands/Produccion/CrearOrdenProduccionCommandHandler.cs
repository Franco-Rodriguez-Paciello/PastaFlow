using Microsoft.EntityFrameworkCore;
using PastaFlow.Application.DTOs;
using PastaFlow.Application.Interfaces;
using PastaFlow.Domain.Entities;
using PastaFlow.Domain.Models;
using PastaFlow.Domain.Services;

namespace PastaFlow.Application.Commands.Produccion;

public sealed class CrearOrdenProduccionCommandHandler
{
    private readonly IPastaFlowDbContext _context;
    private readonly ICostoProduccionService _costoProduccionService;

    public CrearOrdenProduccionCommandHandler(
        IPastaFlowDbContext context,
        ICostoProduccionService costoProduccionService)
    {
        _context = context;
        _costoProduccionService = costoProduccionService;
    }

    public async Task<OrdenProduccionDto> HandleAsync(
        CrearOrdenProduccionCommand command,
        CancellationToken cancellationToken = default)
    {
        // 1. Cargar producto con receta e ingredientes (precios desde BD)
        IQueryable<Producto> productoQuery = _context.Productos
            .Where(p => p.Id == command.ProductoId);

        if (command.EsVerificacionPrevia)
            productoQuery = productoQuery.AsNoTracking();

        Producto? producto = await productoQuery
            .Include(p => p.Receta)
                .ThenInclude(ri => ri.Ingrediente)
            .FirstOrDefaultAsync(cancellationToken);

        if (producto is null)
            throw new KeyNotFoundException(
                $"No se encontró el producto con Id {command.ProductoId}.");

        if (producto.TipoProducto != TipoProducto.Compuesto)
            throw new InvalidOperationException(
                $"El producto '{producto.Nombre}' (Id {command.ProductoId}) no es de tipo Compuesto. " +
                "Solo se puede crear una orden de producción para productos compuestos.");

        if (producto.Receta.Count == 0)
            throw new InvalidOperationException(
                $"El producto '{producto.Nombre}' no tiene ningún insumo asignado en su receta.");

        // 2. Armar snapshot de insumos con precios y stock actuales
        List<ItemRecetaParaCosto> itemsParaCosto = producto.Receta
            .Select(ri => new ItemRecetaParaCosto(
                ri.IngredienteId,
                ri.Ingrediente.Nombre,
                ri.CantidadRequerida,
                ri.Ingrediente.CostoActual,
                ri.Ingrediente.StockActual))
            .ToList();

        // 3. Delegar cálculo de costos al servicio de dominio
        IReadOnlyList<DetalleCostoIngrediente> detalleCostos = _costoProduccionService
            .CalcularDetalleCostos(itemsParaCosto, command.CantidadProducida);

        decimal costoTotal = _costoProduccionService
            .CalcularCostoTotal(itemsParaCosto, command.CantidadProducida);

        decimal margenEstimado = _costoProduccionService.CalcularMargenEstimado(
            producto.PrecioVenta,
            command.CantidadProducida,
            costoTotal);

        bool stockSuficiente = detalleCostos.All(d => d.StockSuficiente);

        // 4. En modo confirmación, rechazar la orden si falta stock
        if (!command.EsVerificacionPrevia && !stockSuficiente)
        {
            DetalleCostoIngrediente insumoFaltante = detalleCostos
                .First(d => !d.StockSuficiente);

            throw new InvalidOperationException(
                $"Stock insuficiente de '{insumoFaltante.NombreIngrediente}' para la orden de producción. " +
                $"Stock disponible: {insumoFaltante.StockDisponible}, " +
                $"requerido: {insumoFaltante.CantidadTotalRequerida}.");
        }

        return new OrdenProduccionDto(
            producto.Id,
            producto.Nombre,
            command.CantidadProducida,
            costoTotal,
            producto.PrecioVenta,
            MargenEstimado: margenEstimado,
            stockSuficiente,
            command.EsVerificacionPrevia,
            detalleCostos
                .Select(d => new DetalleCostoIngredienteDto(
                    d.IngredienteId,
                    d.NombreIngrediente,
                    d.CantidadRequeridaPorUnidad,
                    d.CantidadTotalRequerida,
                    d.CostoUnitario,
                    d.CostoParcial,
                    d.StockDisponible,
                    d.StockSuficiente))
                .ToList());
    }
}

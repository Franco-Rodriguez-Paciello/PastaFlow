using PastaFlow.Domain.Models;

namespace PastaFlow.Domain.Services;

public interface ICostoProduccionService
{
    decimal CalcularCostoTotal(
        IReadOnlyCollection<ItemRecetaParaCosto> items,
        decimal cantidadProducida);

    IReadOnlyList<DetalleCostoIngrediente> CalcularDetalleCostos(
        IReadOnlyCollection<ItemRecetaParaCosto> items,
        decimal cantidadProducida);

    /// <summary>
    /// Margen bruto del lote: ingreso total (precio unitario × cantidad) menos costo total de insumos.
    /// </summary>
    decimal CalcularMargenEstimado(
        decimal precioVentaUnitario,
        decimal cantidadProducida,
        decimal costoTotal);
}

using PastaFlow.Domain.Models;

namespace PastaFlow.Domain.Services;

public sealed class CostoProduccionService : ICostoProduccionService
{
    public decimal CalcularCostoTotal(
        IReadOnlyCollection<ItemRecetaParaCosto> items,
        decimal cantidadProducida)
    {
        ArgumentNullException.ThrowIfNull(items);
        ArgumentOutOfRangeException.ThrowIfNegativeOrZero(cantidadProducida);

        return items.Sum(item =>
            item.CantidadRequeridaPorUnidad * cantidadProducida * item.CostoUnitario);
    }

    public IReadOnlyList<DetalleCostoIngrediente> CalcularDetalleCostos(
        IReadOnlyCollection<ItemRecetaParaCosto> items,
        decimal cantidadProducida)
    {
        ArgumentNullException.ThrowIfNull(items);
        ArgumentOutOfRangeException.ThrowIfNegativeOrZero(cantidadProducida);

        return items
            .Select(item =>
            {
                decimal cantidadTotal = item.CantidadRequeridaPorUnidad * cantidadProducida;
                decimal costoParcial = cantidadTotal * item.CostoUnitario;

                return new DetalleCostoIngrediente(
                    item.IngredienteId,
                    item.NombreIngrediente,
                    item.CantidadRequeridaPorUnidad,
                    cantidadTotal,
                    item.CostoUnitario,
                    costoParcial,
                    item.StockDisponible,
                    item.StockDisponible >= cantidadTotal);
            })
            .ToList();
    }

    public decimal CalcularMargenEstimado(
        decimal precioVentaUnitario,
        decimal cantidadProducida,
        decimal costoTotal)
    {
        ArgumentOutOfRangeException.ThrowIfNegative(precioVentaUnitario);
        ArgumentOutOfRangeException.ThrowIfNegativeOrZero(cantidadProducida);
        ArgumentOutOfRangeException.ThrowIfNegative(costoTotal);

        return precioVentaUnitario * cantidadProducida - costoTotal;
    }
}

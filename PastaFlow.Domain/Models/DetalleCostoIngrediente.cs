namespace PastaFlow.Domain.Models;

/// <summary>
/// Desglose de costo y disponibilidad de stock para un insumo de la receta.
/// </summary>
public sealed record DetalleCostoIngrediente(
    int IngredienteId,
    string NombreIngrediente,
    decimal CantidadRequeridaPorUnidad,
    decimal CantidadTotalRequerida,
    decimal CostoUnitario,
    decimal CostoParcial,
    decimal StockDisponible,
    bool StockSuficiente);

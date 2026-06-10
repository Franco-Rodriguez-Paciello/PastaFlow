namespace PastaFlow.Domain.Models;

/// <summary>
/// Snapshot de un ítem de receta con precio y stock actuales,
/// listo para ser evaluado por el servicio de dominio de costos.
/// </summary>
public sealed record ItemRecetaParaCosto(
    int IngredienteId,
    string NombreIngrediente,
    decimal CantidadRequeridaPorUnidad,
    decimal CostoUnitario,
    decimal StockDisponible);

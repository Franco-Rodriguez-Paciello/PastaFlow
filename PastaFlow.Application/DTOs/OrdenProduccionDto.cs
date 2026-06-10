namespace PastaFlow.Application.DTOs;

public sealed record DetalleCostoIngredienteDto(
    int IngredienteId,
    string NombreIngrediente,
    decimal CantidadRequeridaPorUnidad,
    decimal CantidadTotalRequerida,
    decimal CostoUnitario,
    decimal CostoParcial,
    decimal StockDisponible,
    bool StockSuficiente);

public sealed record OrdenProduccionDto(
    int ProductoId,
    string ProductoNombre,
    decimal CantidadProducida,
    decimal CostoTotal,
    decimal PrecioVentaUnitario,
    decimal MargenEstimado,
    bool StockSuficiente,
    bool EsVerificacionPrevia,
    IReadOnlyCollection<DetalleCostoIngredienteDto> DetalleCostos);

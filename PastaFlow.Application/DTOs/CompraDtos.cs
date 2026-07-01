namespace PastaFlow.Application.DTOs;

public sealed record CompraLineaDto(
    int IngredienteId,
    string NombreIngrediente,
    string UnidadMedida,
    decimal Cantidad,
    decimal PrecioUnitario,
    decimal Subtotal);

public sealed record CompraResumenDto(
    int Id,
    DateTime FechaIngreso,
    string? ProveedorNombre,
    string? NumeroFactura,
    int CantidadLineas,
    decimal Total);

public sealed record CompraDetalleDto(
    int Id,
    DateTime FechaIngreso,
    int? ProveedorId,
    string? ProveedorNombre,
    string? NumeroFactura,
    string? Observaciones,
    decimal Total,
    IReadOnlyCollection<CompraLineaDto> Lineas);

public sealed record SugerenciaCompraDto(
    int IngredienteId,
    string Nombre,
    string UnidadMedida,
    decimal StockActual,
    decimal CantidadSugerida,
    decimal? PrecioReferencia,
    string Motivo);

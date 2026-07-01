namespace PastaFlow.Application.Commands.Compras;

public sealed record CompraLineaInput(
    int IngredienteId,
    decimal Cantidad,
    decimal PrecioUnitario);

public sealed record RegistrarCompraCommand(
    int? ProveedorId,
    string? NumeroFactura,
    string? Observaciones,
    bool ActualizarCosto,
    IReadOnlyList<CompraLineaInput> Lineas);

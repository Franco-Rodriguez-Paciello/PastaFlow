namespace PastaFlow.Application.DTOs;

public sealed record RegistrarVentaDto(
    string MetodoPago,
    IReadOnlyCollection<ItemVentaDto> Items
);

public sealed record ItemVentaDto(
    int ProductoId,
    int Cantidad
);

public sealed record VentaRegistradaDto(
    int Id,
    DateTime Fecha,
    decimal Total,
    string MetodoPago,
    IReadOnlyCollection<DetalleVentaDto> Detalles
);

public sealed record DetalleVentaDto(
    int ProductoId,
    string NombreProducto,
    int Cantidad,
    decimal PrecioUnitario,
    decimal Subtotal
);

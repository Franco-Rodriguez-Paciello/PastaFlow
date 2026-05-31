namespace PastaFlow.Application.DTOs;

public sealed record HistorialProduccionDto(
    int Id,
    int ProductoId,
    string NombreProducto,
    decimal CantidadProducida,
    DateTime FechaDeRegistro);

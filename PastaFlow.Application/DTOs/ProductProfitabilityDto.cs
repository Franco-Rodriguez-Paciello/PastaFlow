namespace PastaFlow.Application.DTOs;

public sealed record ProductProfitabilityDto(
    int Id,
    string Nombre,
    decimal PrecioVenta,
    decimal CostoTotal,
    decimal Margen);

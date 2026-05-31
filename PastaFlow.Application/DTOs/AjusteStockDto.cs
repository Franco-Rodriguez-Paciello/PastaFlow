namespace PastaFlow.Application.DTOs;

public sealed record AjusteStockDto(
    int Id,
    DateTime FechaRegistro,
    int InsumoId,
    string NombreInsumo,
    string TipoAjuste,
    string Motivo,
    decimal Cantidad,
    string? Observaciones);

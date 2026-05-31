namespace PastaFlow.Application.DTOs;

public sealed record RecetaItemDto(
    int IngredienteId,
    string Nombre,
    decimal CostoActual,
    string UnidadMedida,
    decimal CantidadRequerida);

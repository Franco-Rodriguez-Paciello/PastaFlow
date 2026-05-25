namespace PastaFlow.Application.DTOs;

public sealed record IngredienteDto(
    int Id,
    string Nombre,
    string UnidadMedida,
    decimal CostoActual,
    DateTime UltimaActualizacionCosto);

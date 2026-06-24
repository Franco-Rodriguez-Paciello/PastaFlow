namespace PastaFlow.Application.DTOs;

public sealed record ProveedorIngredienteDto(
    int IngredienteId,
    string IngredienteNombre,
    string UnidadMedida,
    string? CodigoProveedor,
    decimal PrecioReferencia,
    bool EsPreferido,
    int? TiempoEntregaDias);

public sealed record ProveedorDto(
    int Id,
    string Nombre,
    string? ContactoNombre,
    string? Telefono,
    string? Email,
    string? Cuit,
    string? Notas,
    bool Activo,
    IReadOnlyCollection<ProveedorIngredienteDto> Ingredientes);

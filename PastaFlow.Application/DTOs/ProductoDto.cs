namespace PastaFlow.Application.DTOs;

public sealed record RecetaIngredienteDto(
    int IngredienteId,
    string NombreIngrediente,
    decimal CantidadRequerida,
    string UnidadMedida);

public sealed record ProductoDto(
    int Id,
    string Nombre,
    string Descripcion,
    decimal PrecioVenta,
    decimal StockActual,
    string TipoProducto,
    bool ActivoParaTiendaOnline,
    IReadOnlyCollection<RecetaIngredienteDto> Receta);

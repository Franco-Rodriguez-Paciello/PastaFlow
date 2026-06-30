namespace PastaFlow.Application.DTOs;

public sealed record RecetaAsistenteContextDto(
    IReadOnlyList<InsumoCatalogoContextDto> InsumosCatalogo);

public sealed record InsumoCatalogoContextDto(
    int Id,
    string Nombre,
    string UnidadMedida,
    decimal CostoActual,
    decimal StockActual);

public sealed record SugerenciaRecetaAnteriorDto(
    string NombreProductoSugerido,
    string Descripcion,
    string? NotasElaboracion,
    IReadOnlyList<IngredienteExistenteSugeridoDto> IngredientesExistentes,
    IReadOnlyList<IngredientePropuestoSugeridoDto> IngredientesPropuestos);

public sealed record SugerirRecetaResultDto(
    string NombreProductoSugerido,
    string Descripcion,
    string? NotasElaboracion,
    IReadOnlyList<IngredienteExistenteSugeridoDto> IngredientesExistentes,
    IReadOnlyList<IngredientePropuestoSugeridoDto> IngredientesPropuestos,
    IReadOnlyList<string> Advertencias,
    CostoRecetaSugeridaDto Costos);

public sealed record IngredienteExistenteSugeridoDto(
    int IngredienteId,
    string Nombre,
    string UnidadMedida,
    decimal CantidadPorKg,
    decimal CostoUnitario,
    decimal CostoParcial);

public sealed record IngredientePropuestoSugeridoDto(
    string ClavePropuesta,
    string NombreSugerido,
    string UnidadMedida,
    decimal CantidadPorKg,
    decimal CostoUnitarioEstimado,
    string? Motivo,
    int? InsumoSimilarId,
    string? NombreInsumoSimilar,
    decimal CostoParcialEstimado);

public sealed record CostoRecetaSugeridaDto(
    decimal CostoConfirmadoPorKg,
    decimal CostoEstimadoAdicionalPorKg,
    decimal CostoTotalProyectadoPorKg,
    bool TieneIngredientesPendientes,
    bool SuperaCostoMaximo,
    decimal? MargenProyectadoPorKg,
    decimal? CostoMaximoPorKg,
    decimal? PrecioVentaObjetivo);

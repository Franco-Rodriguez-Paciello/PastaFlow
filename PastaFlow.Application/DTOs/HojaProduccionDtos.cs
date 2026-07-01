namespace PastaFlow.Application.DTOs;

public sealed record HojaProduccionDiaDto(
    DateOnly FechaObjetivo,
    bool EsFinDeSemana,
    bool EsDia29,
    ClimaPronosticoDto Clima,
    decimal TotalPredicho,
    decimal TotalFaltaProducir,
    int LineasConFalta,
    int LineasStockOk,
    bool PuedeProducirTodo,
    IReadOnlyCollection<HojaProduccionLineaDto> Lineas,
    IReadOnlyCollection<InsumoAgregadoHojaDto> InsumosAgregados);

public sealed record HojaProduccionLineaDto(
    int ProductoId,
    string Nombre,
    decimal CantidadPredicha,
    decimal StockTerminadoActual,
    decimal CantidadProducidaHoy,
    decimal CantidadFaltaProducir,
    bool EsCompuesto,
    bool TieneReceta,
    bool StockInsumosSuficiente,
    decimal? CostoEstimado,
    decimal? MargenEstimado,
    IReadOnlyCollection<DetalleCostoIngredienteDto> DetalleInsumos);

public sealed record InsumoAgregadoHojaDto(
    int IngredienteId,
    string Nombre,
    decimal CantidadRequeridaTotal,
    decimal StockDisponible,
    decimal Faltante,
    bool Suficiente);

namespace PastaFlow.Application.DTOs;

public sealed record ComprasInsightDto(
    int Id,
    string Reporte,
    DateTime GeneradoEnUtc,
    string Origen,
    string DiaOperativo);

public sealed record ComprasInsightResumenDto(
    int Id,
    DateTime GeneradoEnUtc,
    string Origen,
    string DiaOperativo,
    string VistaPrevia);

public sealed record ComprasInsightContextDto(
    DateTime ConsultaUtc,
    string DiaOperativo,
    string HoraInicioDia,
    string ZonaHoraria,
    IReadOnlyCollection<InsumoCriticoContextDto> InsumosCriticos,
    IReadOnlyCollection<MermaRecienteContextDto> MermasRecientes,
    IReadOnlyCollection<VariacionPrecioContextDto> VariacionesPrecio,
    IReadOnlyCollection<ProductoDemandaFinDeSemanaDto> DemandaProyectadaFinDeSemana,
    IReadOnlyCollection<ReposicionSugeridaContextDto> ReposicionesSugeridas,
    IReadOnlyCollection<PanoramaInsumoFinDeSemanaDto> PanoramaFinDeSemana,
    IReadOnlyCollection<ProveedorInsumoContextDto> ProveedoresPorInsumo);

public sealed record InsumoCriticoContextDto(
    string Nombre,
    decimal StockActual,
    decimal UmbralCritico,
    string UnidadMedida,
    decimal CostoActual);

public sealed record MermaRecienteContextDto(
    string NombreInsumo,
    decimal CantidadTotal,
    string UnidadMedida,
    int Registros);

public sealed record VariacionPrecioContextDto(
    string NombreInsumo,
    decimal PrecioAnterior,
    decimal PrecioActual,
    decimal VariacionPorcentaje,
    DateTime FechaCambioUtc);

public sealed record ProductoDemandaFinDeSemanaDto(
    string NombreProducto,
    decimal PromedioUnidadesPorFinDeSemana,
    int FinesDeSemanaAnalizados);

public sealed record ReposicionSugeridaContextDto(
    string NombreInsumo,
    decimal StockActual,
    decimal ConsumoProyectadoFinDeSemana,
    decimal CantidadSugerida,
    string UnidadMedida,
    string Motivo,
    ProveedorSugeridoContextDto? ProveedorSugerido);

public sealed record ProveedorSugeridoContextDto(
    string NombreProveedor,
    decimal PrecioReferencia,
    string? CodigoProveedor,
    int? TiempoEntregaDias,
    string? TelefonoProveedor);

public sealed record ProveedorInsumoContextDto(
    string NombreInsumo,
    string NombreProveedor,
    bool EsPreferido,
    decimal PrecioReferencia,
    string UnidadMedida,
    string? CodigoProveedor,
    int? TiempoEntregaDias,
    string? TelefonoProveedor);

public sealed record PanoramaInsumoFinDeSemanaDto(
    string NombreInsumo,
    decimal StockActual,
    decimal ConsumoProyectado,
    decimal MargenEstimado,
    string UnidadMedida,
    string Estado,
    ProveedorSugeridoContextDto? ProveedorPreferido);

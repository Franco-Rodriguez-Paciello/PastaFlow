namespace PastaFlow.Application.Queries.Produccion;

public sealed record GetHistorialProduccionQuery(
    DateTime? FechaDesde,
    DateTime? FechaHasta,
    int? ProductoId);

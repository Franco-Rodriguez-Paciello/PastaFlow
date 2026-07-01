namespace PastaFlow.Application.Queries.Compras;

public sealed record GetComprasQuery(
    DateTime? FechaDesde,
    DateTime? FechaHasta,
    int? ProveedorId);

using PastaFlow.Domain.Entities;

namespace PastaFlow.Application.Queries.Dashboard;

public sealed record GetHistorialComprasInsightsQuery(
    DateTime? FechaDesde = null,
    DateTime? FechaHasta = null,
    OrigenInformeCompras? Origen = null,
    int Page = 1,
    int PageSize = 20);

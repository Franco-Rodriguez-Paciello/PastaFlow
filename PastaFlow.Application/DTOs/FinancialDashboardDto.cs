namespace PastaFlow.Application.DTOs;

public sealed record FinancialDashboardDto(
    decimal VentasTotalesHoy,
    decimal TotalEfectivoHoy,
    decimal TotalTransferenciaHoy,
    IReadOnlyCollection<ProductoMasVendidoDto> Top5ProductosMasVendidos
);

public sealed record ProductoMasVendidoDto(
    int ProductoId,
    string NombreProducto,
    int TotalUnidadesVendidas,
    decimal TotalFacturado
);

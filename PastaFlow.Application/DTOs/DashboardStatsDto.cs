namespace PastaFlow.Application.DTOs;

public sealed record DashboardStatsDto(
    decimal ValorTotalInsumos,
    decimal ProduccionHoy,
    int InsumosCriticosCount,
    IReadOnlyCollection<StockCriticoItemDto> ListaStockCritico,
    IReadOnlyCollection<UltimaProduccionItemDto> UltimasProducciones
);

public sealed record StockCriticoItemDto(
    string Nombre,
    decimal StockActual,
    string UnidadMedida
);

public sealed record UltimaProduccionItemDto(
    string NombreProducto,
    decimal CantidadProducida,
    DateTime FechaDeRegistro
);

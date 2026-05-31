using Microsoft.EntityFrameworkCore;
using PastaFlow.Application.DTOs;
using PastaFlow.Application.Interfaces;

namespace PastaFlow.Application.Queries.Dashboard;

public sealed class GetDashboardStatsQueryHandler
{
    private readonly IPastaFlowDbContext _context;

    public GetDashboardStatsQueryHandler(IPastaFlowDbContext context)
    {
        _context = context;
    }

    public async Task<DashboardStatsDto> HandleAsync(
        GetDashboardStatsQuery query,
        CancellationToken cancellationToken = default)
    {
        // 1. Valor total de insumos: SUM(StockActual * CostoActual)
        decimal valorTotalInsumos = await _context.Ingredientes
            .AsNoTracking()
            .SumAsync(i => i.StockActual * i.CostoActual, cancellationToken);

        // 2. Producción del día de hoy
        var hoy = DateTime.UtcNow.Date;
        decimal produccionHoy = await _context.HistorialProduccion
            .AsNoTracking()
            .Where(h => h.FechaDeRegistro.Date == hoy)
            .SumAsync(h => h.CantidadProducida, cancellationToken);

        // 3. Un solo viaje a BD: obtiene todos los insumos bajo su umbral individual,
        //    ordenados de menor a mayor stock. El Count y el Take(5) operan en memoria.
        var insumosBajoUmbral = await _context.Ingredientes
            .AsNoTracking()
            .Where(i => i.StockActual <= i.UmbralCritico)
            .OrderBy(i => i.StockActual)
            .Select(i => new StockCriticoItemDto(
                i.Nombre,
                i.StockActual,
                i.UnidadMedida.ToString()))
            .ToListAsync(cancellationToken);

        int insumosCriticosCount = insumosBajoUmbral.Count;
        var listaStockCritico = insumosBajoUmbral.Take(5).ToList();

        // 4. Últimas 5 producciones registradas
        var ultimasProducciones = await _context.HistorialProduccion
            .AsNoTracking()
            .Include(h => h.Producto)
            .OrderByDescending(h => h.FechaDeRegistro)
            .Take(5)
            .Select(h => new UltimaProduccionItemDto(
                h.Producto.Nombre,
                h.CantidadProducida,
                h.FechaDeRegistro))
            .ToListAsync(cancellationToken);

        return new DashboardStatsDto(
            valorTotalInsumos,
            produccionHoy,
            insumosCriticosCount,
            listaStockCritico,
            ultimasProducciones);
    }
}

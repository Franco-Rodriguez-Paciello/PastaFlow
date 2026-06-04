using Microsoft.EntityFrameworkCore;
using PastaFlow.Application.DTOs;
using PastaFlow.Application.Interfaces;

namespace PastaFlow.Application.Queries.Dashboard;

public sealed class GetFinancialDashboardQueryHandler
{
    private readonly IPastaFlowDbContext _context;

    public GetFinancialDashboardQueryHandler(IPastaFlowDbContext context)
    {
        _context = context;
    }

    public async Task<FinancialDashboardDto> HandleAsync(
        GetFinancialDashboardQuery query,
        CancellationToken cancellationToken = default)
    {
        var hoyUtc = DateTime.UtcNow.Date;
        var mananaUtc = hoyUtc.AddDays(1);

        // 1. Ventas del día: un único viaje a BD que trae los agregados de pago
        var ventasHoy = await _context.Ventas
            .AsNoTracking()
            .Where(v => v.Fecha >= hoyUtc && v.Fecha < mananaUtc)
            .GroupBy(_ => 1)
            .Select(g => new
            {
                Total = g.Sum(v => v.Total),
                Efectivo = g.Where(v => v.MetodoPago == "Efectivo").Sum(v => v.Total),
                Transferencia = g.Where(v => v.MetodoPago == "Transferencia").Sum(v => v.Total)
            })
            .FirstOrDefaultAsync(cancellationToken);

        decimal ventasTotalesHoy = ventasHoy?.Total ?? 0m;
        decimal totalEfectivoHoy = ventasHoy?.Efectivo ?? 0m;
        decimal totalTransferenciaHoy = ventasHoy?.Transferencia ?? 0m;

        // 2. Top 5 productos más vendidos del día por unidades
        var top5Raw = await _context.DetallesVenta
            .AsNoTracking()
            .Where(d => d.Venta.Fecha >= hoyUtc && d.Venta.Fecha < mananaUtc)
            .GroupBy(d => new { d.ProductoId, d.Producto.Nombre })
            .Select(g => new
            {
                g.Key.ProductoId,
                g.Key.Nombre,
                TotalUnidades = g.Sum(d => d.Cantidad),
                TotalFacturado = g.Sum(d => d.Subtotal),
            })
            .OrderByDescending(x => x.TotalUnidades)
            .Take(5)
            .ToListAsync(cancellationToken);

        var top5 = top5Raw
            .Select(x => new ProductoMasVendidoDto(x.ProductoId, x.Nombre, x.TotalUnidades, x.TotalFacturado))
            .ToList();

        return new FinancialDashboardDto(
            ventasTotalesHoy,
            totalEfectivoHoy,
            totalTransferenciaHoy,
            top5);
    }
}

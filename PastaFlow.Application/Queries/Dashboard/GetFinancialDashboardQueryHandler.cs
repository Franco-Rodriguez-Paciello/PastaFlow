using Microsoft.EntityFrameworkCore;
using PastaFlow.Application.DTOs;
using PastaFlow.Application.Interfaces;
using PastaFlow.Domain.Entities;

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

        // 1. Ventas del día: agregados con SumAsync (evita GroupBy + FirstOrDefault sin OrderBy)
        IQueryable<Venta> ventasHoyQuery = _context.Ventas
            .AsNoTracking()
            .Where(v => v.Fecha >= hoyUtc && v.Fecha < mananaUtc);

        decimal ventasTotalesHoy = await ventasHoyQuery.SumAsync(v => v.Total, cancellationToken);
        decimal totalEfectivoHoy = await ventasHoyQuery
            .Where(v => v.MetodoPago == "Efectivo")
            .SumAsync(v => v.Total, cancellationToken);
        decimal totalTransferenciaHoy = await ventasHoyQuery
            .Where(v => v.MetodoPago == "Transferencia")
            .SumAsync(v => v.Total, cancellationToken);

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

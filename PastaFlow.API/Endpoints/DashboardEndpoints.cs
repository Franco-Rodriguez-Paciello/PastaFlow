using Microsoft.AspNetCore.Mvc;
using PastaFlow.Application.DTOs;
using PastaFlow.Application.Queries.Dashboard;

namespace PastaFlow.API.Endpoints;

public static class DashboardEndpoints
{
    public static IEndpointRouteBuilder MapDashboardEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/dashboard").RequireAuthorization("AdminOnly");

        group.MapGet("/stats", async (
            GetDashboardStatsQueryHandler handler,
            CancellationToken ct) =>
        {
            DashboardStatsDto stats = await handler.HandleAsync(new GetDashboardStatsQuery(), ct);
            return Results.Ok(stats);
        })
        .WithName("GetDashboardStats")
        .WithSummary("Retorna las métricas agregadas para la pantalla principal")
        .Produces<DashboardStatsDto>(StatusCodes.Status200OK)
        .Produces<ProblemDetails>(StatusCodes.Status500InternalServerError);

        group.MapGet("/financiero", async (
            GetFinancialDashboardQueryHandler handler,
            CancellationToken ct) =>
        {
            FinancialDashboardDto resultado = await handler.HandleAsync(new GetFinancialDashboardQuery(), ct);
            return Results.Ok(resultado);
        })
        .WithName("GetFinancialDashboard")
        .WithSummary("Retorna ventas del día, desglose por método de pago y top 5 productos más vendidos")
        .Produces<FinancialDashboardDto>(StatusCodes.Status200OK)
        .Produces<ProblemDetails>(StatusCodes.Status500InternalServerError);

        return app;
    }
}

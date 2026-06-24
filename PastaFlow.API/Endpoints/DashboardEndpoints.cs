using Microsoft.AspNetCore.Mvc;
using PastaFlow.Application.Commands.Dashboard;
using PastaFlow.Application.DTOs;
using PastaFlow.Application.Queries.Dashboard;
using PastaFlow.Domain.Entities;

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

        group.MapGet("/insights/compras", async (
            GetUltimoComprasInsightQueryHandler handler,
            CancellationToken ct) =>
        {
            ComprasInsightDto? insight = await handler.HandleAsync(new GetUltimoComprasInsightQuery(), ct);
            return insight is null ? Results.NotFound() : Results.Ok(insight);
        })
        .WithName("GetUltimoComprasInsight")
        .WithSummary("Retorna el último informe de compras persistido (sin llamar a la IA)")
        .Produces<ComprasInsightDto>(StatusCodes.Status200OK)
        .Produces(StatusCodes.Status404NotFound)
        .Produces<ProblemDetails>(StatusCodes.Status500InternalServerError);

        group.MapPost("/insights/compras", async (
            GenerateComprasInsightCommandHandler handler,
            CancellationToken ct) =>
        {
            ComprasInsightDto insight = await handler.HandleAsync(
                new GenerateComprasInsightCommand(OrigenInformeCompras.Manual),
                ct);
            return Results.Ok(insight);
        })
        .WithName("GenerateComprasInsight")
        .WithSummary("Genera un informe de compras asistido por IA y lo persiste (on-demand)")
        .Produces<ComprasInsightDto>(StatusCodes.Status200OK)
        .Produces<ProblemDetails>(StatusCodes.Status409Conflict)
        .Produces<ProblemDetails>(StatusCodes.Status500InternalServerError);

        return app;
    }
}

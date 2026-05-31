using Microsoft.AspNetCore.Mvc;
using PastaFlow.Application.DTOs;
using PastaFlow.Application.Queries.Dashboard;

namespace PastaFlow.API.Endpoints;

public static class DashboardEndpoints
{
    public static IEndpointRouteBuilder MapDashboardEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/dashboard");

        group.MapGet("/stats", async (
            GetDashboardStatsQueryHandler handler,
            CancellationToken ct) =>
        {
            try
            {
                DashboardStatsDto stats = await handler.HandleAsync(new GetDashboardStatsQuery(), ct);
                return Results.Ok(stats);
            }
            catch (Exception ex)
            {
                return Results.Problem(
                    detail: ex.Message,
                    statusCode: StatusCodes.Status500InternalServerError,
                    title: "Error al obtener las estadísticas del dashboard");
            }
        })
        .WithName("GetDashboardStats")
        .WithSummary("Retorna las métricas agregadas para la pantalla principal")
        .Produces<DashboardStatsDto>(StatusCodes.Status200OK)
        .Produces<ProblemDetails>(StatusCodes.Status500InternalServerError);

        return app;
    }
}

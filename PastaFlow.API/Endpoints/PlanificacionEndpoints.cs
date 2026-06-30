using Microsoft.AspNetCore.Mvc;
using PastaFlow.Application.Commands.Planificacion;
using PastaFlow.Application.DTOs;
using PastaFlow.Application.Queries.Planificacion;

namespace PastaFlow.API.Endpoints;

public sealed record GenerarRecomendacionDemandaRequest(DateOnly? Fecha);

public static class PlanificacionEndpoints
{
    public static IEndpointRouteBuilder MapPlanificacionEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/planificacion").RequireAuthorization("AdminOnly");

        group.MapGet("/demanda", async (
            [FromQuery] DateOnly? fecha,
            GetPrediccionDemandaQueryHandler handler,
            CancellationToken ct) =>
        {
            DateOnly objetivo = fecha ?? DateOnly.FromDateTime(DateTime.UtcNow).AddDays(1);
            PrediccionDemandaDto resultado = await handler.HandleAsync(
                new GetPrediccionDemandaQuery(objetivo),
                ct);
            return Results.Ok(resultado);
        })
        .WithName("GetPrediccionDemanda")
        .WithSummary("Predicción de demanda por calendario para una fecha objetivo (sin IA)")
        .Produces<PrediccionDemandaDto>(StatusCodes.Status200OK)
        .Produces<ProblemDetails>(StatusCodes.Status500InternalServerError);

        group.MapPost("/demanda/recomendacion", async (
            [FromBody] GenerarRecomendacionDemandaRequest? body,
            GenerarRecomendacionDemandaCommandHandler handler,
            CancellationToken ct) =>
        {
            DateOnly objetivo = body?.Fecha ?? DateOnly.FromDateTime(DateTime.UtcNow).AddDays(1);
            PrediccionDemandaDto resultado = await handler.HandleAsync(
                new GenerarRecomendacionDemandaCommand(objetivo),
                ct);
            return Results.Ok(resultado);
        })
        .WithName("GenerarRecomendacionDemanda")
        .WithSummary("Genera una recomendación de producción asistida por IA sobre la predicción calculada")
        .Produces<PrediccionDemandaDto>(StatusCodes.Status200OK)
        .Produces<ProblemDetails>(StatusCodes.Status502BadGateway)
        .Produces<ProblemDetails>(StatusCodes.Status503ServiceUnavailable);

        group.MapGet("/historico", async (
            [FromQuery] int? dias,
            GetSerieHistoricaDemandaQueryHandler handler,
            CancellationToken ct) =>
        {
            IReadOnlyList<SerieDiariaDto> serie = await handler.HandleAsync(
                new GetSerieHistoricaDemandaQuery(dias ?? 90),
                ct);
            return Results.Ok(serie);
        })
        .WithName("GetSerieHistoricaDemanda")
        .WithSummary("Serie diaria de unidades vendidas en los últimos N días (para gráficos)")
        .Produces<IReadOnlyList<SerieDiariaDto>>(StatusCodes.Status200OK);

        group.MapGet("/precision", async (
            GetBacktestDemandaQueryHandler handler,
            CancellationToken ct) =>
        {
            BacktestDemandaDto resultado = await handler.HandleAsync(new GetBacktestDemandaQuery(), ct);
            return Results.Ok(resultado);
        })
        .WithName("GetBacktestDemanda")
        .WithSummary("Valida el modelo (predicción vs. real) sobre un período de prueba y devuelve métricas")
        .Produces<BacktestDemandaDto>(StatusCodes.Status200OK);

        return app;
    }
}

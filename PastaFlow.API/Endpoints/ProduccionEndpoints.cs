using Microsoft.AspNetCore.Mvc;
using PastaFlow.API.Middleware;
using PastaFlow.Application.Commands.Produccion;
using PastaFlow.Application.DTOs;
using PastaFlow.Application.Queries.Produccion;

namespace PastaFlow.API.Endpoints;

public static class ProduccionEndpoints
{
    public static IEndpointRouteBuilder MapProduccionEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/produccion").RequireAuthorization("AdminOrOperario");

        group.MapGet("/historial", async (
            [FromQuery] DateTime? fechaDesde,
            [FromQuery] DateTime? fechaHasta,
            [FromQuery] int? productoId,
            GetHistorialProduccionQueryHandler handler,
            CancellationToken ct) =>
        {
            var query = new GetHistorialProduccionQuery(fechaDesde, fechaHasta, productoId);
            IReadOnlyCollection<HistorialProduccionDto> historial = await handler.HandleAsync(query, ct);
            return Results.Ok(historial);
        })
        .WithName("GetHistorialProduccion")
        .WithSummary("Retorna el historial de producciones con filtros opcionales por producto y rango de fechas")
        .Produces<IReadOnlyCollection<HistorialProduccionDto>>(StatusCodes.Status200OK)
        .Produces<object>(StatusCodes.Status400BadRequest);

        group.MapPost("/", async (
            [FromBody] RegistrarProduccionCommand command,
            RegistrarProduccionCommandHandler handler,
            CancellationToken ct) =>
        {
            int registroId = await handler.HandleAsync(command, ct);
            return Results.Created($"/api/produccion/{registroId}", new { id = registroId });
        })
        .AddEndpointFilter<ValidationFilter<RegistrarProduccionCommand>>()
        .WithName("RegistrarProduccion")
        .WithSummary("Registra una producción diaria: descuenta insumos y aumenta stock del producto terminado")
        .Produces<object>(StatusCodes.Status201Created)
        .Produces<ProblemDetails>(StatusCodes.Status400BadRequest)
        .Produces<ProblemDetails>(StatusCodes.Status404NotFound)
        .Produces<ProblemDetails>(StatusCodes.Status409Conflict);

        group.MapPost("/orden", async (
            [FromBody] CrearOrdenProduccionCommand command,
            CrearOrdenProduccionCommandHandler handler,
            CancellationToken ct) =>
        {
            CrearOrdenProduccionCommand confirmationCommand =
                command with { EsVerificacionPrevia = false };

            OrdenProduccionDto orden = await handler.HandleAsync(confirmationCommand, ct);
            return Results.Created($"/api/produccion/orden/{orden.ProductoId}", orden);
        })
        .AddEndpointFilter<ValidationFilter<CrearOrdenProduccionCommand>>()
        .WithName("CrearOrdenProduccion")
        .WithSummary("Crea una orden de producción: calcula costos y valida stock de insumos")
        .Produces<OrdenProduccionDto>(StatusCodes.Status201Created)
        .Produces<ProblemDetails>(StatusCodes.Status400BadRequest)
        .Produces<ProblemDetails>(StatusCodes.Status404NotFound)
        .Produces<ProblemDetails>(StatusCodes.Status409Conflict);

        group.MapPost("/verificar", async (
            [FromBody] CrearOrdenProduccionCommand command,
            CrearOrdenProduccionCommandHandler handler,
            CancellationToken ct) =>
        {
            CrearOrdenProduccionCommand verificationCommand =
                command with { EsVerificacionPrevia = true };

            OrdenProduccionDto orden = await handler.HandleAsync(verificationCommand, ct);
            return Results.Ok(orden);
        })
        .AddEndpointFilter<ValidationFilter<CrearOrdenProduccionCommand>>()
        .WithName("VerificarOrdenProduccion")
        .WithSummary("Verifica una orden de producción: calcula costos y valida stock sin modificar datos")
        .Produces<OrdenProduccionDto>(StatusCodes.Status200OK)
        .Produces<ProblemDetails>(StatusCodes.Status400BadRequest)
        .Produces<ProblemDetails>(StatusCodes.Status404NotFound);

        return app;
    }
}

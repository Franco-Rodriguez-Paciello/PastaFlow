using Microsoft.AspNetCore.Mvc;
using PastaFlow.API.Middleware;
using PastaFlow.Application.Commands.Compras;
using PastaFlow.Application.DTOs;
using PastaFlow.Application.Queries.Compras;

namespace PastaFlow.API.Endpoints;

public static class CompraEndpoints
{
    public static IEndpointRouteBuilder MapCompraEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/compras").RequireAuthorization("AdminOnly");

        group.MapGet("/", async (
            [FromQuery] DateTime? fechaDesde,
            [FromQuery] DateTime? fechaHasta,
            [FromQuery] int? proveedorId,
            GetComprasQueryHandler handler,
            CancellationToken ct) =>
        {
            IReadOnlyCollection<CompraResumenDto> compras = await handler.HandleAsync(
                new GetComprasQuery(fechaDesde, fechaHasta, proveedorId),
                ct);
            return Results.Ok(compras);
        })
        .WithName("GetCompras")
        .WithSummary("Lista de ingresos de mercadería registrados")
        .Produces<IReadOnlyCollection<CompraResumenDto>>(StatusCodes.Status200OK);

        group.MapGet("/sugerencias", async (
            [FromQuery] DateOnly? fecha,
            GetSugerenciasCompraQueryHandler handler,
            CancellationToken ct) =>
        {
            IReadOnlyCollection<SugerenciaCompraDto> sugerencias = await handler.HandleAsync(
                new GetSugerenciasCompraQuery(fecha),
                ct);
            return Results.Ok(sugerencias);
        })
        .WithName("GetSugerenciasCompra")
        .WithSummary("Sugerencias de compra según faltantes de la hoja y stock crítico")
        .Produces<IReadOnlyCollection<SugerenciaCompraDto>>(StatusCodes.Status200OK);

        group.MapGet("/{id:int}", async (
            int id,
            GetCompraByIdQueryHandler handler,
            CancellationToken ct) =>
        {
            CompraDetalleDto compra = await handler.HandleAsync(new GetCompraByIdQuery(id), ct);
            return Results.Ok(compra);
        })
        .WithName("GetCompraById")
        .WithSummary("Detalle de un ingreso de mercadería")
        .Produces<CompraDetalleDto>(StatusCodes.Status200OK)
        .Produces<ProblemDetails>(StatusCodes.Status404NotFound);

        group.MapPost("/", async (
            [FromBody] RegistrarCompraCommand command,
            RegistrarCompraCommandHandler handler,
            CancellationToken ct) =>
        {
            int id = await handler.HandleAsync(command, ct);
            return Results.Created($"/api/compras/{id}", new { id });
        })
        .AddEndpointFilter<ValidationFilter<RegistrarCompraCommand>>()
        .WithName("RegistrarCompra")
        .WithSummary("Registra un ingreso de mercadería: suma stock y opcionalmente actualiza costos")
        .Produces<object>(StatusCodes.Status201Created)
        .Produces<ProblemDetails>(StatusCodes.Status400BadRequest)
        .Produces<ProblemDetails>(StatusCodes.Status404NotFound);

        return app;
    }
}

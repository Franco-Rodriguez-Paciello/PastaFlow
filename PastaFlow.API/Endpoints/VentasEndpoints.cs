using Microsoft.AspNetCore.Mvc;
using PastaFlow.API.Middleware;
using PastaFlow.Application.Commands.Ventas;
using PastaFlow.Application.DTOs;
using System.Security.Claims;

namespace PastaFlow.API.Endpoints;

public static class VentasEndpoints
{
    public static IEndpointRouteBuilder MapVentasEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/ventas").RequireAuthorization();

        group.MapPost("/", async (
            [FromBody] RegistrarVentaDto dto,
            RegistrarVentaCommandHandler handler,
            ClaimsPrincipal user,
            CancellationToken ct) =>
        {
            var usuarioIdStr = user.FindFirstValue(ClaimTypes.NameIdentifier);
            if (!int.TryParse(usuarioIdStr, out var usuarioId))
                return Results.Unauthorized();

            var command = new RegistrarVentaCommand(
                usuarioId,
                dto.MetodoPago,
                dto.Items.Select(i => new ItemVentaCommand(i.ProductoId, i.Cantidad)).ToList());

            VentaRegistradaDto resultado = await handler.HandleAsync(command, ct);
            return Results.Created($"/api/ventas/{resultado.Id}", resultado);
        })
        .AddEndpointFilter<ValidationFilter<RegistrarVentaDto>>()
        .WithName("RegistrarVenta")
        .WithSummary("Registra una venta, descuenta el stock de productos terminados y persiste el ticket")
        .Produces<VentaRegistradaDto>(StatusCodes.Status201Created)
        .Produces<ProblemDetails>(StatusCodes.Status400BadRequest)
        .Produces<ProblemDetails>(StatusCodes.Status404NotFound)
        .Produces<ProblemDetails>(StatusCodes.Status409Conflict)
        .Produces(StatusCodes.Status401Unauthorized);

        return app;
    }
}

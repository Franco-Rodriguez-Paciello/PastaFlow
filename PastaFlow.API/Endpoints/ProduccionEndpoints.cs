using Microsoft.AspNetCore.Mvc;
using PastaFlow.Application.Commands.Produccion;

namespace PastaFlow.API.Endpoints;

public static class ProduccionEndpoints
{
    public static IEndpointRouteBuilder MapProduccionEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/produccion");

        group.MapPost("/", async (
            [FromBody] RegistrarProduccionCommand command,
            RegistrarProduccionCommandHandler handler,
            CancellationToken ct) =>
        {
            try
            {
                int registroId = await handler.HandleAsync(command, ct);
                return Results.Created($"/api/produccion/{registroId}", new { id = registroId });
            }
            catch (KeyNotFoundException ex)
            {
                return Results.NotFound(new { error = ex.Message });
            }
            catch (InvalidOperationException ex)
            {
                return Results.BadRequest(new { error = ex.Message });
            }
            catch (ArgumentException ex)
            {
                return Results.BadRequest(new { error = ex.Message });
            }
        })
        .WithName("RegistrarProduccion")
        .WithSummary("Registra una producción diaria: descuenta insumos y aumenta stock del producto terminado")
        .Produces<object>(StatusCodes.Status201Created)
        .Produces<object>(StatusCodes.Status400BadRequest)
        .Produces<object>(StatusCodes.Status404NotFound);

        return app;
    }
}

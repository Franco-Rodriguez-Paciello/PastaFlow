using PastaFlow.Application.Commands.Ingredientes;
using PastaFlow.Application.DTOs;
using PastaFlow.Application.Queries.Ingredientes;
using Microsoft.AspNetCore.Mvc;

namespace PastaFlow.API.Endpoints;

/// <summary>Body del endpoint PUT /{id}/costo.</summary>
public sealed record ActualizarCostoRequest(decimal NuevoCosto);

public static class IngredienteEndpoints
{
    public static IEndpointRouteBuilder MapIngredienteEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/ingredientes");

        group.MapGet("/", async (
            GetIngredientesQueryHandler handler,
            CancellationToken ct) =>
        {
            IReadOnlyCollection<IngredienteDto> ingredientes =
                await handler.HandleAsync(new GetIngredientesQuery(), ct);
            return Results.Ok(ingredientes);
        })
        .WithName("GetIngredientes")
        .WithSummary("Retorna todos los ingredientes ordenados alfabéticamente")
        .Produces<IReadOnlyCollection<IngredienteDto>>(StatusCodes.Status200OK);

        group.MapPost("/", async (
            [FromBody] RegistrarIngredienteCommand command,
            RegistrarIngredienteCommandHandler handler,
            CancellationToken ct) =>
        {
            try
            {
                int id = await handler.HandleAsync(command, ct);
                return Results.Created($"/api/ingredientes/{id}", new { id });
            }
            catch (InvalidOperationException ex)
            {
                return Results.Conflict(new { error = ex.Message });
            }
            catch (ArgumentException ex)
            {
                return Results.BadRequest(new { error = ex.Message });
            }
        })
        .WithName("RegistrarIngrediente")
        .WithSummary("Registra un nuevo ingrediente")
        .Produces<object>(StatusCodes.Status201Created)
        .Produces<object>(StatusCodes.Status400BadRequest)
        .Produces<object>(StatusCodes.Status409Conflict);

        group.MapPut("/{id:int}/costo", async (
            int id,
            [FromBody] ActualizarCostoRequest body,
            ActualizarCostoIngredienteCommandHandler handler,
            CancellationToken ct) =>
        {
            try
            {
                var command = new ActualizarCostoIngredienteCommand(id, body.NuevoCosto);
                await handler.HandleAsync(command, ct);
                return Results.NoContent();
            }
            catch (KeyNotFoundException ex)
            {
                return Results.NotFound(new { error = ex.Message });
            }
            catch (ArgumentException ex)
            {
                return Results.BadRequest(new { error = ex.Message });
            }
        })
        .WithName("ActualizarCostoIngrediente")
        .WithSummary("Actualiza el costo de un ingrediente existente")
        .Produces(StatusCodes.Status204NoContent)
        .Produces<object>(StatusCodes.Status400BadRequest)
        .Produces<object>(StatusCodes.Status404NotFound);

        return app;
    }
}

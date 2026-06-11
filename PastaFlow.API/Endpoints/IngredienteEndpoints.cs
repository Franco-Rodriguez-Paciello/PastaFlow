using PastaFlow.Application.Commands.Ingredientes;
using PastaFlow.Application.DTOs;
using PastaFlow.Application.Queries.Ingredientes;
using Microsoft.AspNetCore.Mvc;

namespace PastaFlow.API.Endpoints;

/// <summary>Body del endpoint PUT /{id}/costo.</summary>
public sealed record ActualizarCostoRequest(decimal NuevoCosto);

/// <summary>Body del endpoint PATCH /{id}/stock.</summary>
public sealed record ActualizarStockRequest(decimal NuevoStock);

/// <summary>Body del endpoint PATCH /{id}/umbral.</summary>
public sealed record ActualizarUmbralRequest(decimal NuevoUmbral);

public static class IngredienteEndpoints
{
    public static IEndpointRouteBuilder MapIngredienteEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/ingredientes").RequireAuthorization();

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
            int id = await handler.HandleAsync(command, ct);
            return Results.Created($"/api/ingredientes/{id}", new { id });
        })
        .WithName("RegistrarIngrediente")
        .WithSummary("Registra un nuevo ingrediente")
        .RequireAuthorization("AdminOnly")
        .Produces<object>(StatusCodes.Status201Created)
        .Produces<ProblemDetails>(StatusCodes.Status400BadRequest)
        .Produces<ProblemDetails>(StatusCodes.Status409Conflict);

        group.MapPut("/{id:int}/costo", async (
            int id,
            [FromBody] ActualizarCostoRequest body,
            ActualizarCostoIngredienteCommandHandler handler,
            CancellationToken ct) =>
        {
            var command = new ActualizarCostoIngredienteCommand(id, body.NuevoCosto);
            await handler.HandleAsync(command, ct);
            return Results.NoContent();
        })
        .WithName("ActualizarCostoIngrediente")
        .WithSummary("Actualiza el costo de un ingrediente existente")
        .RequireAuthorization("AdminOnly")
        .Produces(StatusCodes.Status204NoContent)
        .Produces<ProblemDetails>(StatusCodes.Status400BadRequest)
        .Produces<ProblemDetails>(StatusCodes.Status404NotFound);

        group.MapPatch("/{id:int}/stock", async (
            int id,
            [FromBody] ActualizarStockRequest body,
            ActualizarStockIngredienteCommandHandler handler,
            CancellationToken ct) =>
        {
            var command = new ActualizarStockIngredienteCommand(id, body.NuevoStock);
            await handler.HandleAsync(command, ct);
            return Results.NoContent();
        })
        .WithName("ActualizarStockIngrediente")
        .WithSummary("Actualiza el stock actual de un ingrediente de forma directa")
        .RequireAuthorization("AdminOnly")
        .Produces(StatusCodes.Status204NoContent)
        .Produces<ProblemDetails>(StatusCodes.Status400BadRequest)
        .Produces<ProblemDetails>(StatusCodes.Status404NotFound);

        group.MapPatch("/{id:int}/umbral", async (
            int id,
            [FromBody] ActualizarUmbralRequest body,
            ActualizarUmbralIngredienteCommandHandler handler,
            CancellationToken ct) =>
        {
            var command = new ActualizarUmbralIngredienteCommand(id, body.NuevoUmbral);
            await handler.HandleAsync(command, ct);
            return Results.NoContent();
        })
        .WithName("ActualizarUmbralIngrediente")
        .WithSummary("Actualiza el umbral crítico de stock de un ingrediente")
        .RequireAuthorization("AdminOnly")
        .Produces(StatusCodes.Status204NoContent)
        .Produces<ProblemDetails>(StatusCodes.Status400BadRequest)
        .Produces<ProblemDetails>(StatusCodes.Status404NotFound);

        group.MapGet("/ajustes", async (
            [FromQuery] int? insumoId,
            [FromQuery] int take,
            GetHistorialAjustesQueryHandler handler,
            CancellationToken ct) =>
        {
            var query = new GetHistorialAjustesQuery(insumoId, take > 0 ? take : 100);
            var ajustes = await handler.HandleAsync(query, ct);
            return Results.Ok(ajustes);
        })
        .WithName("GetHistorialAjustes")
        .WithSummary("Retorna el historial de ajustes manuales de stock")
        .RequireAuthorization("AdminOnly")
        .Produces<IReadOnlyCollection<AjusteStockDto>>(StatusCodes.Status200OK);

        group.MapPost("/ajuste", async (
            [FromBody] RegistrarAjusteManualCommand command,
            RegistrarAjusteManualCommandHandler handler,
            CancellationToken ct) =>
        {
            int ajusteId = await handler.HandleAsync(command, ct);
            return Results.Created($"/api/ingredientes/ajuste/{ajusteId}", new { id = ajusteId });
        })
        .WithName("RegistrarAjusteManual")
        .WithSummary("Registra un ajuste manual de stock (merma, rotura, conteo físico, compra manual)")
        .RequireAuthorization("AdminOnly")
        .Produces<object>(StatusCodes.Status201Created)
        .Produces<ProblemDetails>(StatusCodes.Status400BadRequest)
        .Produces<ProblemDetails>(StatusCodes.Status404NotFound)
        .Produces<ProblemDetails>(StatusCodes.Status409Conflict);

        return app;
    }
}

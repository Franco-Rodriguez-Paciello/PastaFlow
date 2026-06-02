using PastaFlow.Application.Commands.Ingredientes;
using PastaFlow.Application.DTOs;
using PastaFlow.Application.Interfaces;
using PastaFlow.Application.Queries.Ingredientes;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

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
            int id = await handler.HandleAsync(command, ct);
            return Results.Created($"/api/ingredientes/{id}", new { id });
        })
        .WithName("RegistrarIngrediente")
        .WithSummary("Registra un nuevo ingrediente")
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
        .Produces(StatusCodes.Status204NoContent)
        .Produces<ProblemDetails>(StatusCodes.Status400BadRequest)
        .Produces<ProblemDetails>(StatusCodes.Status404NotFound);

        group.MapPatch("/{id:int}/stock", async (
            int id,
            [FromBody] ActualizarStockRequest body,
            IPastaFlowDbContext context,
            CancellationToken ct) =>
        {
            var ingrediente = await context.Ingredientes
                .FirstOrDefaultAsync(i => i.Id == id, ct);

            if (ingrediente is null)
                return Results.NotFound(new { error = $"No se encontró un ingrediente con el ID '{id}'." });

            ingrediente.AjustarStock(body.NuevoStock);

            await context.SaveChangesAsync(ct);
            return Results.NoContent();
        })
        .WithName("ActualizarStockIngrediente")
        .WithSummary("Actualiza el stock actual de un ingrediente de forma directa")
        .Produces(StatusCodes.Status204NoContent)
        .Produces<ProblemDetails>(StatusCodes.Status400BadRequest)
        .Produces<ProblemDetails>(StatusCodes.Status404NotFound);

        group.MapPatch("/{id:int}/umbral", async (
            int id,
            [FromBody] ActualizarUmbralRequest body,
            IPastaFlowDbContext context,
            CancellationToken ct) =>
        {
            var ingrediente = await context.Ingredientes
                .FirstOrDefaultAsync(i => i.Id == id, ct);

            if (ingrediente is null)
                return Results.NotFound(new { error = $"No se encontró un ingrediente con el ID '{id}'." });

            ingrediente.SetUmbralCritico(body.NuevoUmbral);

            await context.SaveChangesAsync(ct);
            return Results.NoContent();
        })
        .WithName("ActualizarUmbralIngrediente")
        .WithSummary("Actualiza el umbral crítico de stock de un ingrediente")
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
        .Produces<object>(StatusCodes.Status201Created)
        .Produces<ProblemDetails>(StatusCodes.Status400BadRequest)
        .Produces<ProblemDetails>(StatusCodes.Status404NotFound)
        .Produces<ProblemDetails>(StatusCodes.Status409Conflict);

        return app;
    }
}

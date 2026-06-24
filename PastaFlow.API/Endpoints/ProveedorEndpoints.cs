using PastaFlow.Application.Commands.Proveedores;
using PastaFlow.Application.DTOs;
using PastaFlow.Application.Queries.Proveedores;
using Microsoft.AspNetCore.Mvc;

namespace PastaFlow.API.Endpoints;

public sealed record ActualizarProveedorRequest(
    string Nombre,
    string? ContactoNombre,
    string? Telefono,
    string? Email,
    string? Cuit,
    string? Notas,
    bool Activo);

public sealed record VincularIngredienteRequest(
    int IngredienteId,
    decimal PrecioReferencia,
    string? CodigoProveedor,
    bool EsPreferido,
    int? TiempoEntregaDias);

public static class ProveedorEndpoints
{
    public static IEndpointRouteBuilder MapProveedorEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/proveedores").RequireAuthorization();

        group.MapGet("/", async (
            GetProveedoresQueryHandler handler,
            CancellationToken ct) =>
        {
            IReadOnlyCollection<ProveedorDto> proveedores =
                await handler.HandleAsync(new GetProveedoresQuery(), ct);
            return Results.Ok(proveedores);
        })
        .WithName("GetProveedores")
        .WithSummary("Retorna todos los proveedores con sus insumos vinculados")
        .Produces<IReadOnlyCollection<ProveedorDto>>(StatusCodes.Status200OK);

        group.MapPost("/", async (
            [FromBody] RegistrarProveedorCommand command,
            RegistrarProveedorCommandHandler handler,
            CancellationToken ct) =>
        {
            int id = await handler.HandleAsync(command, ct);
            return Results.Created($"/api/proveedores/{id}", new { id });
        })
        .WithName("RegistrarProveedor")
        .WithSummary("Registra un nuevo proveedor")
        .RequireAuthorization("AdminOnly")
        .Produces<object>(StatusCodes.Status201Created)
        .Produces<ProblemDetails>(StatusCodes.Status400BadRequest)
        .Produces<ProblemDetails>(StatusCodes.Status409Conflict);

        group.MapPut("/{id:int}", async (
            int id,
            [FromBody] ActualizarProveedorRequest body,
            ActualizarProveedorCommandHandler handler,
            CancellationToken ct) =>
        {
            var command = new ActualizarProveedorCommand(
                id,
                body.Nombre,
                body.ContactoNombre,
                body.Telefono,
                body.Email,
                body.Cuit,
                body.Notas,
                body.Activo);
            await handler.HandleAsync(command, ct);
            return Results.NoContent();
        })
        .WithName("ActualizarProveedor")
        .WithSummary("Actualiza los datos de un proveedor")
        .RequireAuthorization("AdminOnly")
        .Produces(StatusCodes.Status204NoContent)
        .Produces<ProblemDetails>(StatusCodes.Status400BadRequest)
        .Produces<ProblemDetails>(StatusCodes.Status404NotFound)
        .Produces<ProblemDetails>(StatusCodes.Status409Conflict);

        group.MapPost("/{id:int}/ingredientes", async (
            int id,
            [FromBody] VincularIngredienteRequest body,
            VincularIngredienteProveedorCommandHandler handler,
            CancellationToken ct) =>
        {
            var command = new VincularIngredienteProveedorCommand(
                id,
                body.IngredienteId,
                body.PrecioReferencia,
                body.CodigoProveedor,
                body.EsPreferido,
                body.TiempoEntregaDias);
            await handler.HandleAsync(command, ct);
            return Results.NoContent();
        })
        .WithName("VincularIngredienteProveedor")
        .WithSummary("Vincula o actualiza un insumo del proveedor")
        .RequireAuthorization("AdminOnly")
        .Produces(StatusCodes.Status204NoContent)
        .Produces<ProblemDetails>(StatusCodes.Status400BadRequest)
        .Produces<ProblemDetails>(StatusCodes.Status404NotFound);

        group.MapDelete("/{id:int}/ingredientes/{ingredienteId:int}", async (
            int id,
            int ingredienteId,
            DesvincularIngredienteProveedorCommandHandler handler,
            CancellationToken ct) =>
        {
            await handler.HandleAsync(new DesvincularIngredienteProveedorCommand(id, ingredienteId), ct);
            return Results.NoContent();
        })
        .WithName("DesvincularIngredienteProveedor")
        .WithSummary("Elimina el vínculo entre proveedor e insumo")
        .RequireAuthorization("AdminOnly")
        .Produces(StatusCodes.Status204NoContent)
        .Produces<ProblemDetails>(StatusCodes.Status404NotFound);

        return app;
    }
}

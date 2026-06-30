using Microsoft.AspNetCore.Mvc;
using PastaFlow.Application.Commands.Productos;
using PastaFlow.Application.DTOs;
using PastaFlow.Application.Queries.Productos;

namespace PastaFlow.API.Endpoints;

public static class ProductoEndpoints
{
    public static IEndpointRouteBuilder MapProductoEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/productos").RequireAuthorization();

        group.MapGet("/", async (
            GetProductosQueryHandler handler,
            CancellationToken ct) =>
        {
            IReadOnlyCollection<ProductoDto> productos =
                await handler.HandleAsync(new GetProductosQuery(), ct);
            return Results.Ok(productos);
        })
        .WithName("GetProductos")
        .WithSummary("Retorna todos los productos ordenados alfabéticamente con su receta")
        .Produces<IReadOnlyCollection<ProductoDto>>(StatusCodes.Status200OK);

        group.MapPost("/", async (
            [FromBody] RegistrarProductoCommand command,
            RegistrarProductoCommandHandler handler,
            CancellationToken ct) =>
        {
            int id = await handler.HandleAsync(command, ct);
            return Results.Created($"/api/productos/{id}", new { id });
        })
        .WithName("RegistrarProducto")
        .WithSummary("Registra un nuevo producto")
        .Produces<object>(StatusCodes.Status201Created)
        .Produces<ProblemDetails>(StatusCodes.Status400BadRequest)
        .Produces<ProblemDetails>(StatusCodes.Status409Conflict);

        group.MapPost("/recetas/sugerir", async (
            [FromBody] SugerirRecetaCommand command,
            SugerirRecetaCommandHandler handler,
            CancellationToken ct) =>
        {
            SugerirRecetaResultDto resultado = await handler.HandleAsync(command, ct);
            return Results.Ok(resultado);
        })
        .WithName("SugerirReceta")
        .WithSummary("Sugiere una receta con IA a partir de un brief, con costos calculados en servidor")
        .RequireAuthorization("AdminOnly")
        .Produces<SugerirRecetaResultDto>(StatusCodes.Status200OK)
        .Produces<ProblemDetails>(StatusCodes.Status400BadRequest);

        group.MapPost("/recetas/sugerir/refinar", async (
            [FromBody] RefinarRecetaSugeridaCommand command,
            RefinarRecetaSugeridaCommandHandler handler,
            CancellationToken ct) =>
        {
            SugerirRecetaResultDto resultado = await handler.HandleAsync(command, ct);
            return Results.Ok(resultado);
        })
        .WithName("RefinarRecetaSugerida")
        .WithSummary("Ajusta una sugerencia de receta existente según feedback del usuario")
        .RequireAuthorization("AdminOnly")
        .Produces<SugerirRecetaResultDto>(StatusCodes.Status200OK)
        .Produces<ProblemDetails>(StatusCodes.Status400BadRequest);

        group.MapPost("/{id:int}/receta", async (
            int id,
            [FromBody] List<IngredienteRecetaInput> ingredientes,
            AsignarRecetaCommandHandler handler,
            CancellationToken ct) =>
        {
            var command = new AsignarRecetaCommand(id, ingredientes);
            await handler.HandleAsync(command, ct);
            return Results.NoContent();
        })
        .WithName("AsignarReceta")
        .WithSummary("Asigna o reemplaza la receta (bill of materials) de un producto compuesto")
        .Produces(StatusCodes.Status204NoContent)
        .Produces<ProblemDetails>(StatusCodes.Status400BadRequest)
        .Produces<ProblemDetails>(StatusCodes.Status404NotFound);

        group.MapGet("/{productId:int}/receta", async (
            int productId,
            GetRecetaByProductoQueryHandler handler,
            CancellationToken ct) =>
        {
            IReadOnlyCollection<RecetaItemDto> receta =
                await handler.HandleAsync(new GetRecetaByProductoQuery(productId), ct);
            return Results.Ok(receta);
        })
        .WithName("GetRecetaByProducto")
        .WithSummary("Retorna los ingredientes y cantidades de la receta de un producto")
        .Produces<IReadOnlyCollection<RecetaItemDto>>(StatusCodes.Status200OK);

        group.MapGet("/rentabilidad", async (
            GetProductProfitabilityQueryHandler handler,
            CancellationToken ct) =>
        {
            IReadOnlyCollection<ProductProfitabilityDto> resultado =
                await handler.HandleAsync(new GetProductProfitabilityQuery(), ct);
            return Results.Ok(resultado);
        })
        .WithName("GetProductProfitability")
        .WithSummary("Retorna el costo total, precio de venta y margen de cada producto compuesto")
        .Produces<IReadOnlyCollection<ProductProfitabilityDto>>(StatusCodes.Status200OK);

        group.MapPost("/guardar-receta", async (
            [FromBody] GuardarRecetaCommand command,
            GuardarRecetaCommandHandler handler,
            CancellationToken ct) =>
        {
            int productoId = await handler.HandleAsync(command, ct);
            return Results.Created($"/api/productos/{productoId}/receta", new { productoId });
        })
        .WithName("GuardarReceta")
        .WithSummary("Crea un producto nuevo o actualiza uno existente junto con su receta en una única transacción")
        .Produces<object>(StatusCodes.Status201Created)
        .Produces<object>(StatusCodes.Status400BadRequest)
        .Produces<object>(StatusCodes.Status404NotFound);

        return app;
    }
}

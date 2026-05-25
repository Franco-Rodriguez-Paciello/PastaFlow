using Microsoft.AspNetCore.Mvc;
using PastaFlow.Application.Commands.Productos;
using PastaFlow.Application.DTOs;
using PastaFlow.Application.Queries.Productos;

namespace PastaFlow.API.Endpoints;

public static class ProductoEndpoints
{
    public static IEndpointRouteBuilder MapProductoEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/productos");

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
            try
            {
                int id = await handler.HandleAsync(command, ct);
                return Results.Created($"/api/productos/{id}", new { id });
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
        .WithName("RegistrarProducto")
        .WithSummary("Registra un nuevo producto")
        .Produces<object>(StatusCodes.Status201Created)
        .Produces<object>(StatusCodes.Status400BadRequest)
        .Produces<object>(StatusCodes.Status409Conflict);

        group.MapPost("/{id:int}/receta", async (
            int id,
            [FromBody] List<IngredienteRecetaInput> ingredientes,
            AsignarRecetaCommandHandler handler,
            CancellationToken ct) =>
        {
            try
            {
                var command = new AsignarRecetaCommand(id, ingredientes);
                await handler.HandleAsync(command, ct);
                return Results.NoContent();
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
        .WithName("AsignarReceta")
        .WithSummary("Asigna o reemplaza la receta (bill of materials) de un producto compuesto")
        .Produces(StatusCodes.Status204NoContent)
        .Produces<object>(StatusCodes.Status400BadRequest)
        .Produces<object>(StatusCodes.Status404NotFound);

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

        return app;
    }
}

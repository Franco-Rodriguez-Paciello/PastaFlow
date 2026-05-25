namespace PastaFlow.Application.Commands.Productos;

public sealed record IngredienteRecetaInput(
    int IngredienteId,
    decimal CantidadRequerida);

public sealed record AsignarRecetaCommand(
    int ProductoId,
    IReadOnlyCollection<IngredienteRecetaInput> Ingredientes);

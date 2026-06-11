namespace PastaFlow.Application.Commands.Ingredientes;

public sealed record ActualizarStockIngredienteCommand(
    int IngredienteId,
    decimal NuevoStock);

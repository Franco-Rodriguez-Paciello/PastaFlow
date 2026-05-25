namespace PastaFlow.Application.Commands.Ingredientes;

public sealed record ActualizarCostoIngredienteCommand(
    int IngredienteId,
    decimal NuevoCosto);

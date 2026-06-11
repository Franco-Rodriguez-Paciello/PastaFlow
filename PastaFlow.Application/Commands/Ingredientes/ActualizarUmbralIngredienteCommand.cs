namespace PastaFlow.Application.Commands.Ingredientes;

public sealed record ActualizarUmbralIngredienteCommand(
    int IngredienteId,
    decimal NuevoUmbral);

using PastaFlow.Domain.Entities;

namespace PastaFlow.Application.Commands.Ingredientes;

public sealed record RegistrarIngredienteCommand(
    string Nombre,
    UnidadMedida UnidadMedida,
    decimal CostoInicial);

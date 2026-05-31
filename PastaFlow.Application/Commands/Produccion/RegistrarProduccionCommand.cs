namespace PastaFlow.Application.Commands.Produccion;

public sealed record RegistrarProduccionCommand(
    int ProductoId,
    decimal CantidadProducida);

namespace PastaFlow.Application.Commands.Produccion;

public sealed record CrearOrdenProduccionCommand(
    int ProductoId,
    decimal CantidadProducida,
    bool EsVerificacionPrevia = false);

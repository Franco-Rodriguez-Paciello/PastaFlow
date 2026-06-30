namespace PastaFlow.Application.Commands.Productos;

public sealed record SugerirRecetaCommand(
    string BriefUsuario,
    decimal? CostoMaximoPorKg = null,
    decimal? PrecioVentaObjetivo = null);

using PastaFlow.Application.DTOs;

namespace PastaFlow.Application.Commands.Productos;

public sealed record RefinarRecetaSugeridaCommand(
    string BriefUsuario,
    string MensajeRefinamiento,
    SugerenciaRecetaAnteriorDto SugerenciaAnterior,
    decimal? CostoMaximoPorKg = null,
    decimal? PrecioVentaObjetivo = null);

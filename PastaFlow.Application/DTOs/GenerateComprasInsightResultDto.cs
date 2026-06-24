namespace PastaFlow.Application.DTOs;

public enum ComprasInsightEmailEstado
{
    NoSolicitado,
    Deshabilitado,
    SinDestinatarios,
    Enviado,
    Error
}

public sealed record ComprasInsightEmailResult(
    ComprasInsightEmailEstado Estado,
    string? Detalle = null);

public sealed record GenerateComprasInsightResultDto(
    ComprasInsightDto Insight,
    ComprasInsightEmailEstado EmailEstado,
    string? EmailDetalle);

using PastaFlow.Domain.Entities;

namespace PastaFlow.Application.Commands.Ingredientes;

public sealed record RegistrarAjusteManualCommand(
    int InsumoId,
    decimal Cantidad,
    TipoAjuste TipoAjuste,
    MotivoAjuste Motivo,
    string? Observaciones);

using PastaFlow.Application.DTOs;

namespace PastaFlow.Application.Interfaces;

public interface IRecetaAsistenteContextBuilder
{
    Task<RecetaAsistenteContextDto> BuildAsync(CancellationToken cancellationToken = default);
}

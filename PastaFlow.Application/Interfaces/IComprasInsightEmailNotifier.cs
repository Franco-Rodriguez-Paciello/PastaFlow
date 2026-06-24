using PastaFlow.Application.DTOs;
using PastaFlow.Domain.Entities;

namespace PastaFlow.Application.Interfaces;

public interface IComprasInsightEmailNotifier
{
    /// <summary>
    /// Envía el informe por correo si la configuración y el origen lo permiten.
    /// No lanza excepción si el envío falla (el informe ya quedó persistido).
    /// </summary>
    Task<ComprasInsightEmailResult> NotifyIfConfiguredAsync(
        ComprasInsightDto informe,
        OrigenInformeCompras origen,
        bool enviarPorEmail,
        CancellationToken cancellationToken = default);
}

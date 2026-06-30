namespace PastaFlow.Application.Exceptions;

/// <summary>
/// Error al invocar un proveedor de IA o al interpretar su respuesta.
/// Se expone al cliente con mensaje legible (sin detalles técnicos).
/// </summary>
public sealed class LlmServiceException : Exception
{
    public LlmServiceException(string message, bool isTransient = true)
        : base(message)
    {
        IsTransient = isTransient;
    }

    /// <summary>
    /// Si es verdadero, el cliente puede reintentar en breve (503).
    /// Si es falso, suele ser configuración o un error no recuperable (502).
    /// </summary>
    public bool IsTransient { get; }
}

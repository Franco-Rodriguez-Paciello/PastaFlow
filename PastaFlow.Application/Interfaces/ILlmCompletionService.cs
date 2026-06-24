namespace PastaFlow.Application.Interfaces;

/// <summary>
/// Abstracción para generar texto con un modelo de lenguaje externo.
/// La capa Application define el contrato; Infrastructure implementa el proveedor (Gemini, etc.).
/// </summary>
public interface ILlmCompletionService
{
    Task<string> GenerateTextAsync(
        string systemPrompt,
        string userPrompt,
        CancellationToken cancellationToken = default);
}

namespace PastaFlow.Application.Options;

/// <summary>
/// Selección del proveedor de LLM. Permite cambiar entre Gemini y Groq sin tocar la lógica de negocio.
/// </summary>
public sealed class LlmOptions
{
    public const string SectionName = "Llm";

    /// <summary>Valores: "Groq" | "Gemini". Default: Groq (tier gratuito sin prepago).</summary>
    public string Provider { get; init; } = "Groq";
}

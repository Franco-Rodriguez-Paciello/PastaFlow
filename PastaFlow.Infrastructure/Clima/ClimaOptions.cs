namespace PastaFlow.Infrastructure.Clima;

public sealed class ClimaOptions
{
    public const string SectionName = "Clima";

    /// <summary>Ubicación de la fábrica (por defecto: Buenos Aires).</summary>
    public double Latitude { get; init; } = -34.6037;

    public double Longitude { get; init; } = -58.3816;

    public string Timezone { get; init; } = "America/Argentina/Buenos_Aires";

    /// <summary>Temperatura máxima (°C) por debajo de la cual el día se considera frío.</summary>
    public double TempMaxFrioC { get; init; } = 14;

    /// <summary>Precipitación (mm) a partir de la cual el día se considera lluvioso.</summary>
    public double PrecipLluviaMm { get; init; } = 2;
}

namespace PastaFlow.Application.Options;

/// <summary>
/// Configuración del insight de compras. Permite ajustar el inicio operativo del día
/// según la temporada (ej. verano vs invierno en la fábrica).
/// </summary>
public sealed class ComprasInsightOptions
{
    public const string SectionName = "ComprasInsight";

    /// <summary>Hora local en que comienza el día operativo. Default: 07:00.</summary>
    public TimeSpan HoraInicioDia { get; init; } = new(7, 0, 0);

    /// <summary>Zona horaria IANA de la planta. Default: Argentina.</summary>
    public string ZonaHoraria { get; init; } = "America/Argentina/Buenos_Aires";

    /// <summary>Días hacia atrás para analizar mermas y variaciones de precio.</summary>
    public int DiasHistorial { get; init; } = 30;

    /// <summary>Cantidad de fines de semana históricos usados para proyectar demanda.</summary>
    public int FinesDeSemanaHistorial { get; init; } = 4;

    /// <summary>Minutos antes de HoraInicioDia en que corre el job automático. Default: 30 (06:30 si inicio 07:00).</summary>
    public int MinutosAntesDelInicioOperativo { get; init; } = 30;

    /// <summary>Habilita la generación automática diaria en segundo plano.</summary>
    public bool JobNocturnoHabilitado { get; init; } = true;

    /// <summary>
    /// Envía correo al generar el insight automático (requiere Email:Habilitado).
    /// </summary>
    public bool EnviarEmailEnGeneracionAutomatica { get; init; } = true;
}

namespace PastaFlow.Domain.Entities;

public enum OrigenInformeCompras
{
    Automatico,
    Manual
}

/// <summary>
/// Informe de compras generado por IA, persistido para consulta sin volver a llamar al LLM.
/// </summary>
public class InformeComprasInsight
{
    public int Id { get; private set; }
    public string Reporte { get; private set; } = null!;
    public DateTime GeneradoEnUtc { get; private set; }
    public OrigenInformeCompras Origen { get; private set; }

    /// <summary>Día operativo de la planta (yyyy-MM-dd) al momento de la generación.</summary>
    public string DiaOperativo { get; private set; } = null!;

    private InformeComprasInsight() { }

    public InformeComprasInsight(
        string reporte,
        OrigenInformeCompras origen,
        string diaOperativo)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(reporte);
        ArgumentException.ThrowIfNullOrWhiteSpace(diaOperativo);

        Reporte = reporte;
        Origen = origen;
        DiaOperativo = diaOperativo;
        GeneradoEnUtc = DateTime.UtcNow;
    }
}

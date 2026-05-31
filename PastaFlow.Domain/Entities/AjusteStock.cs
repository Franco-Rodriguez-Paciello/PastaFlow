namespace PastaFlow.Domain.Entities;

public enum TipoAjuste { Suma, Resta }

public enum MotivoAjuste { Merma, Rotura, ConteoFisico, CompraManual }

public class AjusteStock
{
    public int Id { get; private set; }
    public int InsumoId { get; private set; }
    public decimal Cantidad { get; private set; }
    public TipoAjuste TipoAjuste { get; private set; }
    public MotivoAjuste Motivo { get; private set; }
    public string? Observaciones { get; private set; }
    public DateTime FechaRegistro { get; private set; }

    // Propiedad de navegación
    public Ingrediente Insumo { get; private set; } = null!;

    private AjusteStock() { }

    public AjusteStock(
        int insumoId,
        decimal cantidad,
        TipoAjuste tipoAjuste,
        MotivoAjuste motivo,
        string? observaciones)
    {
        ArgumentOutOfRangeException.ThrowIfNegativeOrZero(insumoId);
        ArgumentOutOfRangeException.ThrowIfNegativeOrZero(cantidad);

        InsumoId = insumoId;
        Cantidad = cantidad;
        TipoAjuste = tipoAjuste;
        Motivo = motivo;
        Observaciones = observaciones?.Trim();
        FechaRegistro = DateTime.UtcNow;
    }
}

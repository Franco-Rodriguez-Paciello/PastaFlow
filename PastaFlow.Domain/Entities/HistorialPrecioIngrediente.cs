namespace PastaFlow.Domain.Entities;

public class HistorialPrecioIngrediente
{
    public int Id { get; private set; }
    public int IngredienteId { get; private set; }
    public decimal PrecioCostoAnterior { get; private set; }
    public decimal PrecioCostoNuevo { get; private set; }
    public DateTime FechaRegistro { get; private set; }

    // Propiedad de navegación
    public Ingrediente Ingrediente { get; private set; } = null!;

    private HistorialPrecioIngrediente() { }

    public HistorialPrecioIngrediente(int ingredienteId, decimal precioCostoAnterior, decimal precioCostoNuevo)
    {
        // ingredienteId puede ser 0 cuando EF Core aún no generó el PK del padre;
        // el Change Tracker resolverá el FK antes de ejecutar el INSERT.
        ArgumentOutOfRangeException.ThrowIfNegative(ingredienteId);
        ArgumentOutOfRangeException.ThrowIfNegative(precioCostoAnterior);
        ArgumentOutOfRangeException.ThrowIfNegative(precioCostoNuevo);

        IngredienteId = ingredienteId;
        PrecioCostoAnterior = precioCostoAnterior;
        PrecioCostoNuevo = precioCostoNuevo;
        FechaRegistro = DateTime.UtcNow;
    }
}

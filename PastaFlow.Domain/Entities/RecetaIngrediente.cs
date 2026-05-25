namespace PastaFlow.Domain.Entities;

public class RecetaIngrediente
{
    public int ProductoId { get; private set; }
    public int IngredienteId { get; private set; }
    public decimal CantidadRequerida { get; private set; }

    // Propiedades de navegación
    public Producto Producto { get; private set; } = null!;
    public Ingrediente Ingrediente { get; private set; } = null!;

    private RecetaIngrediente() { }

    public RecetaIngrediente(int productoId, int ingredienteId, decimal cantidadRequerida)
    {
        ArgumentOutOfRangeException.ThrowIfNegativeOrZero(productoId);
        ArgumentOutOfRangeException.ThrowIfNegativeOrZero(ingredienteId);
        ArgumentOutOfRangeException.ThrowIfNegativeOrZero(cantidadRequerida);

        ProductoId = productoId;
        IngredienteId = ingredienteId;
        CantidadRequerida = cantidadRequerida;
    }
}

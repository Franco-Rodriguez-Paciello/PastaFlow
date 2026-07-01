namespace PastaFlow.Domain.Entities;

public class CompraLinea
{
    public int Id { get; private set; }
    public int CompraId { get; private set; }
    public int IngredienteId { get; private set; }
    public decimal Cantidad { get; private set; }
    public decimal PrecioUnitario { get; private set; }
    public decimal Subtotal { get; private set; }

    public Compra Compra { get; private set; } = null!;
    public Ingrediente Ingrediente { get; private set; } = null!;

    private CompraLinea() { }

    public CompraLinea(int ingredienteId, decimal cantidad, decimal precioUnitario)
    {
        ArgumentOutOfRangeException.ThrowIfNegativeOrZero(ingredienteId);
        ArgumentOutOfRangeException.ThrowIfNegativeOrZero(cantidad);
        ArgumentOutOfRangeException.ThrowIfNegative(precioUnitario);

        IngredienteId = ingredienteId;
        Cantidad = cantidad;
        PrecioUnitario = precioUnitario;
        Subtotal = cantidad * precioUnitario;
    }
}

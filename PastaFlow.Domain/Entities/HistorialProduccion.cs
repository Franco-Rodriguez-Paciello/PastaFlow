namespace PastaFlow.Domain.Entities;

public class HistorialProduccion
{
    public int Id { get; private set; }
    public int ProductoId { get; private set; }
    public decimal CantidadProducida { get; private set; }
    public decimal CostoTotalReal { get; private set; }
    public decimal CostoUnitarioReal { get; private set; }
    public DateTime FechaDeRegistro { get; private set; }

    // Propiedad de navegación
    public Producto Producto { get; private set; } = null!;

    private HistorialProduccion() { }

    public HistorialProduccion(
        int productoId,
        decimal cantidadProducida,
        decimal costoTotalReal,
        decimal costoUnitarioReal)
    {
        ArgumentOutOfRangeException.ThrowIfNegativeOrZero(productoId);
        ArgumentOutOfRangeException.ThrowIfNegativeOrZero(cantidadProducida);
        ArgumentOutOfRangeException.ThrowIfNegative(costoTotalReal);
        ArgumentOutOfRangeException.ThrowIfNegative(costoUnitarioReal);

        ProductoId = productoId;
        CantidadProducida = cantidadProducida;
        CostoTotalReal = costoTotalReal;
        CostoUnitarioReal = costoUnitarioReal;
        FechaDeRegistro = DateTime.UtcNow;
    }
}

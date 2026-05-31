namespace PastaFlow.Domain.Entities;

public class HistorialProduccion
{
    public int Id { get; private set; }
    public int ProductoId { get; private set; }
    public decimal CantidadProducida { get; private set; }
    public DateTime FechaDeRegistro { get; private set; }

    // Propiedad de navegación
    public Producto Producto { get; private set; } = null!;

    private HistorialProduccion() { }

    public HistorialProduccion(int productoId, decimal cantidadProducida)
    {
        ArgumentOutOfRangeException.ThrowIfNegativeOrZero(productoId);
        ArgumentOutOfRangeException.ThrowIfNegativeOrZero(cantidadProducida);

        ProductoId = productoId;
        CantidadProducida = cantidadProducida;
        FechaDeRegistro = DateTime.UtcNow;
    }
}

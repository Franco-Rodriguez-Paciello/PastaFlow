namespace PastaFlow.Domain.Entities;

public class DetalleVenta
{
    public int Id { get; private set; }
    public int VentaId { get; private set; }
    public int ProductoId { get; private set; }
    public int Cantidad { get; private set; }
    public decimal PrecioUnitario { get; private set; }
    public decimal Subtotal { get; private set; }

    public Venta Venta { get; private set; } = null!;
    public Producto Producto { get; private set; } = null!;

    private DetalleVenta() { }

    public DetalleVenta(int productoId, int cantidad, decimal precioUnitario)
    {
        ArgumentOutOfRangeException.ThrowIfLessThanOrEqual(productoId, 0);
        ArgumentOutOfRangeException.ThrowIfLessThanOrEqual(cantidad, 0);
        ArgumentOutOfRangeException.ThrowIfNegativeOrZero(precioUnitario);

        ProductoId = productoId;
        Cantidad = cantidad;
        PrecioUnitario = precioUnitario;
        Subtotal = cantidad * precioUnitario;
    }
}

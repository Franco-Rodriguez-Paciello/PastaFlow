namespace PastaFlow.Domain.Entities;

public class Venta
{
    public int Id { get; private set; }
    public DateTime Fecha { get; private set; }
    public decimal Total { get; private set; }
    public string MetodoPago { get; private set; } = null!;
    public int UsuarioId { get; private set; }

    public Usuario Usuario { get; private set; } = null!;
    public IReadOnlyCollection<DetalleVenta> Detalles { get; private set; } = new List<DetalleVenta>();

    private Venta() { }

    public Venta(int usuarioId, string metodoPago, IReadOnlyCollection<DetalleVenta> detalles)
    {
        ArgumentOutOfRangeException.ThrowIfLessThanOrEqual(usuarioId, 0);
        ArgumentException.ThrowIfNullOrWhiteSpace(metodoPago);
        ArgumentNullException.ThrowIfNull(detalles);

        if (metodoPago != "Efectivo" && metodoPago != "Transferencia")
            throw new ArgumentException("El método de pago debe ser 'Efectivo' o 'Transferencia'.", nameof(metodoPago));

        UsuarioId = usuarioId;
        MetodoPago = metodoPago;
        Fecha = DateTime.UtcNow;
        Total = detalles.Sum(d => d.Subtotal);
        Detalles = detalles;
    }

    /// <summary>
    /// Crea una venta con fecha explícita. Uso exclusivo para importación o migración
    /// de ventas históricas (datos previos al sistema o generación de datos de prueba).
    /// El flujo normal de mostrador debe usar el constructor público (fecha = ahora).
    /// </summary>
    public static Venta Importar(
        int usuarioId,
        string metodoPago,
        DateTime fechaUtc,
        IReadOnlyCollection<DetalleVenta> detalles)
    {
        var venta = new Venta(usuarioId, metodoPago, detalles);
        venta.Fecha = fechaUtc;
        return venta;
    }
}

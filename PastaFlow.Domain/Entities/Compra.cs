namespace PastaFlow.Domain.Entities;

public class Compra
{
    public int Id { get; private set; }
    public int? ProveedorId { get; private set; }
    public DateTime FechaIngreso { get; private set; }
    public string? NumeroFactura { get; private set; }
    public string? Observaciones { get; private set; }
    public decimal Total { get; private set; }

    public Proveedor? Proveedor { get; private set; }
    public IReadOnlyCollection<CompraLinea> Lineas { get; private set; } = [];

    private Compra() { }

    public Compra(
        int? proveedorId,
        string? numeroFactura,
        string? observaciones,
        IReadOnlyCollection<CompraLinea> lineas)
    {
        if (lineas is null || lineas.Count == 0)
            throw new ArgumentException("La compra debe tener al menos una línea.", nameof(lineas));

        if (proveedorId is <= 0)
            throw new ArgumentOutOfRangeException(nameof(proveedorId));

        ProveedorId = proveedorId;
        NumeroFactura = string.IsNullOrWhiteSpace(numeroFactura) ? null : numeroFactura.Trim();
        Observaciones = string.IsNullOrWhiteSpace(observaciones) ? null : observaciones.Trim();
        FechaIngreso = DateTime.UtcNow;
        Lineas = lineas;
        Total = lineas.Sum(l => l.Subtotal);
    }
}

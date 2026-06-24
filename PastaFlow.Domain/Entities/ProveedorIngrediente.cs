namespace PastaFlow.Domain.Entities;

public class ProveedorIngrediente
{
    public int ProveedorId { get; private set; }
    public int IngredienteId { get; private set; }
    public string? CodigoProveedor { get; private set; }
    public decimal PrecioReferencia { get; private set; }
    public bool EsPreferido { get; private set; }
    public int? TiempoEntregaDias { get; private set; }

    public Proveedor Proveedor { get; private set; } = null!;
    public Ingrediente Ingrediente { get; private set; } = null!;

    private ProveedorIngrediente() { }

    public ProveedorIngrediente(
        int proveedorId,
        int ingredienteId,
        decimal precioReferencia,
        string? codigoProveedor = null,
        bool esPreferido = false,
        int? tiempoEntregaDias = null)
    {
        ArgumentOutOfRangeException.ThrowIfNegativeOrZero(proveedorId);
        ArgumentOutOfRangeException.ThrowIfNegativeOrZero(ingredienteId);
        ArgumentOutOfRangeException.ThrowIfNegative(precioReferencia);

        if (tiempoEntregaDias is < 0)
            throw new ArgumentOutOfRangeException(nameof(tiempoEntregaDias));

        ProveedorId = proveedorId;
        IngredienteId = ingredienteId;
        PrecioReferencia = precioReferencia;
        CodigoProveedor = string.IsNullOrWhiteSpace(codigoProveedor) ? null : codigoProveedor.Trim();
        EsPreferido = esPreferido;
        TiempoEntregaDias = tiempoEntregaDias;
    }

    public void Actualizar(
        decimal precioReferencia,
        string? codigoProveedor,
        bool esPreferido,
        int? tiempoEntregaDias)
    {
        ArgumentOutOfRangeException.ThrowIfNegative(precioReferencia);

        if (tiempoEntregaDias is < 0)
            throw new ArgumentOutOfRangeException(nameof(tiempoEntregaDias));

        PrecioReferencia = precioReferencia;
        CodigoProveedor = string.IsNullOrWhiteSpace(codigoProveedor) ? null : codigoProveedor.Trim();
        EsPreferido = esPreferido;
        TiempoEntregaDias = tiempoEntregaDias;
    }
}

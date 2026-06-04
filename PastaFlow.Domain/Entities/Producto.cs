namespace PastaFlow.Domain.Entities;

public class Producto
{
    public int Id { get; private set; }
    public string Nombre { get; private set; } = null!;
    public string Descripcion { get; private set; } = null!;
    public decimal PrecioVenta { get; private set; }
    public decimal StockActual { get; private set; }
    public TipoProducto TipoProducto { get; private set; }
    public bool ActivoParaTiendaOnline { get; private set; }
    public IReadOnlyCollection<RecetaIngrediente> Receta { get; private set; } = new List<RecetaIngrediente>();

    private Producto() { }

    public Producto(string nombre, string descripcion, decimal precioVenta, TipoProducto tipoProducto)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(nombre);
        ArgumentException.ThrowIfNullOrWhiteSpace(descripcion);
        ArgumentOutOfRangeException.ThrowIfNegative(precioVenta);

        Nombre = nombre;
        Descripcion = descripcion;
        PrecioVenta = precioVenta;
        TipoProducto = tipoProducto;
        StockActual = 0;
        ActivoParaTiendaOnline = false;
    }

    public void ConvertirACompuesto()
    {
        TipoProducto = TipoProducto.Compuesto;
    }

    public void ActualizarActivoParaTiendaOnline(bool activo)
    {
        ActivoParaTiendaOnline = activo;
    }

    public void AjustarStock(decimal stock)
    {
        ArgumentOutOfRangeException.ThrowIfNegative(stock);
        StockActual = stock;
    }

    public void AumentarStock(decimal cantidad)
    {
        ArgumentOutOfRangeException.ThrowIfNegativeOrZero(cantidad);
        StockActual += cantidad;
    }

    public void DescontarStock(int cantidad)
    {
        ArgumentOutOfRangeException.ThrowIfNegativeOrZero(cantidad);

        if (StockActual < cantidad)
            throw new InvalidOperationException(
                $"Stock insuficiente para '{Nombre}'. Stock disponible: {StockActual}, solicitado: {cantidad}.");

        StockActual -= cantidad;
    }
}

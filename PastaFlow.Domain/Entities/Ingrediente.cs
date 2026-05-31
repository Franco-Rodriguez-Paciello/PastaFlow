namespace PastaFlow.Domain.Entities;

public class Ingrediente
{
    public int Id { get; private set; }
    public string Nombre { get; private set; } = null!;
    public UnidadMedida UnidadMedida { get; private set; }
    public decimal CostoActual { get; private set; }
    public decimal StockActual { get; private set; }
    public decimal UmbralCritico { get; private set; }
    public DateTime UltimaActualizacionCosto { get; private set; }

    private Ingrediente() { }

    public Ingrediente(string nombre, UnidadMedida unidadMedida, decimal costoActual)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(nombre);
        ArgumentOutOfRangeException.ThrowIfNegative(costoActual);

        Nombre = nombre;
        UnidadMedida = unidadMedida;
        CostoActual = costoActual;
        StockActual = 0;
        UmbralCritico = 5m;
        UltimaActualizacionCosto = DateTime.UtcNow;
    }

    public void SetUmbralCritico(decimal umbral)
    {
        ArgumentOutOfRangeException.ThrowIfNegative(umbral);
        UmbralCritico = umbral;
    }

    public void ActualizarCosto(decimal nuevoCosto)
    {
        ArgumentOutOfRangeException.ThrowIfNegative(nuevoCosto);
        CostoActual = nuevoCosto;
        UltimaActualizacionCosto = DateTime.UtcNow;
    }

    public void AjustarStock(decimal stock)
    {
        ArgumentOutOfRangeException.ThrowIfNegative(stock);
        StockActual = stock;
    }

    /// <summary>
    /// Descuenta la cantidad indicada del stock. Permite stock negativo (modo permisivo).
    /// </summary>
    public void DescontarStock(decimal cantidad)
    {
        ArgumentOutOfRangeException.ThrowIfNegativeOrZero(cantidad);
        StockActual -= cantidad;
    }
}

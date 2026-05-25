namespace PastaFlow.Domain.Entities;

public class Ingrediente
{
    public int Id { get; private set; }
    public string Nombre { get; private set; } = null!;
    public UnidadMedida UnidadMedida { get; private set; }
    public decimal CostoActual { get; private set; }
    public DateTime UltimaActualizacionCosto { get; private set; }

    private Ingrediente() { }

    public Ingrediente(string nombre, UnidadMedida unidadMedida, decimal costoActual)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(nombre);
        ArgumentOutOfRangeException.ThrowIfNegative(costoActual);

        Nombre = nombre;
        UnidadMedida = unidadMedida;
        CostoActual = costoActual;
        UltimaActualizacionCosto = DateTime.UtcNow;
    }

    public void ActualizarCosto(decimal nuevoCosto)
    {
        ArgumentOutOfRangeException.ThrowIfNegative(nuevoCosto);
        CostoActual = nuevoCosto;
        UltimaActualizacionCosto = DateTime.UtcNow;
    }
}

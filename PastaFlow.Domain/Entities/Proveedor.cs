namespace PastaFlow.Domain.Entities;

public class Proveedor
{
    public int Id { get; private set; }
    public string Nombre { get; private set; } = null!;
    public string? ContactoNombre { get; private set; }
    public string? Telefono { get; private set; }
    public string? Email { get; private set; }
    public string? Cuit { get; private set; }
    public string? Notas { get; private set; }
    public bool Activo { get; private set; }
    public IReadOnlyCollection<ProveedorIngrediente> Ingredientes { get; private set; } = new List<ProveedorIngrediente>();

    private Proveedor() { }

    public Proveedor(
        string nombre,
        string? contactoNombre = null,
        string? telefono = null,
        string? email = null,
        string? cuit = null,
        string? notas = null)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(nombre);

        Nombre = nombre.Trim();
        ContactoNombre = NormalizeOptional(contactoNombre);
        Telefono = NormalizeOptional(telefono);
        Email = NormalizeOptional(email);
        Cuit = NormalizeOptional(cuit);
        Notas = NormalizeOptional(notas);
        Activo = true;
    }

    public void Actualizar(
        string nombre,
        string? contactoNombre,
        string? telefono,
        string? email,
        string? cuit,
        string? notas,
        bool activo)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(nombre);

        Nombre = nombre.Trim();
        ContactoNombre = NormalizeOptional(contactoNombre);
        Telefono = NormalizeOptional(telefono);
        Email = NormalizeOptional(email);
        Cuit = NormalizeOptional(cuit);
        Notas = NormalizeOptional(notas);
        Activo = activo;
    }

    private static string? NormalizeOptional(string? value)
        => string.IsNullOrWhiteSpace(value) ? null : value.Trim();
}

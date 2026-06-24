namespace PastaFlow.Application.Commands.Proveedores;

public sealed record RegistrarProveedorCommand(
    string Nombre,
    string? ContactoNombre,
    string? Telefono,
    string? Email,
    string? Cuit,
    string? Notas);

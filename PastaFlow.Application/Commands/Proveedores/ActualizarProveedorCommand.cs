namespace PastaFlow.Application.Commands.Proveedores;

public sealed record ActualizarProveedorCommand(
    int Id,
    string Nombre,
    string? ContactoNombre,
    string? Telefono,
    string? Email,
    string? Cuit,
    string? Notas,
    bool Activo);

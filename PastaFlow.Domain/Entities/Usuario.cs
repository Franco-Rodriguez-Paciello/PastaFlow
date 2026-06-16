using PastaFlow.Domain;

namespace PastaFlow.Domain.Entities;

public class Usuario
{
    public int Id { get; private set; }
    public string Username { get; private set; } = null!;
    public string PasswordHash { get; private set; } = null!;
    public string Rol { get; private set; } = Roles.Admin;
    public DateTime FechaCreacion { get; private set; }

    private Usuario() { }

    public Usuario(string username, string passwordHash, string rol = Roles.Admin)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(username);
        ArgumentException.ThrowIfNullOrWhiteSpace(passwordHash);

        Username = username;
        PasswordHash = passwordHash;
        Rol = rol;
        FechaCreacion = DateTime.UtcNow;
    }

    /// <summary>Actualiza el hash de la contraseña (para futuros cambios de clave).</summary>
    public void ActualizarPassword(string nuevoHash)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(nuevoHash);
        PasswordHash = nuevoHash;
    }

    /// <summary>Cambia el rol del usuario.</summary>
    public void CambiarRol(string nuevoRol)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(nuevoRol);
        Rol = nuevoRol;
    }
}

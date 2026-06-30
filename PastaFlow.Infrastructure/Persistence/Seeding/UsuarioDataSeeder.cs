using Microsoft.EntityFrameworkCore;
using PastaFlow.Domain;
using PastaFlow.Domain.Entities;

namespace PastaFlow.Infrastructure.Persistence.Seeding;

/// <summary>
/// Crea usuarios de demo para Development (solo si la tabla está vacía).
/// Credenciales documentadas en README.md.
/// </summary>
public static class UsuarioDataSeeder
{
    public const string AdminUsername = "admin";
    public const string AdminPassword = "admin123";
    public const string OperarioUsername = "operario";
    public const string OperarioPassword = "operario123";

    public static async Task SeedAsync(PastaFlowDbContext context, CancellationToken cancellationToken = default)
    {
        if (await context.Usuarios.AnyAsync(cancellationToken))
            return;

        var usuarios = new[]
        {
            new Usuario(AdminUsername, BCrypt.Net.BCrypt.HashPassword(AdminPassword), Roles.Admin),
            new Usuario(OperarioUsername, BCrypt.Net.BCrypt.HashPassword(OperarioPassword), Roles.Operario),
        };

        context.Usuarios.AddRange(usuarios);
        await context.SaveChangesAsync(cancellationToken);

        Console.WriteLine(
            $"[UsuarioDataSeeder] Usuarios de demo creados: {AdminUsername} (Admin), {OperarioUsername} (Operario).");
    }
}

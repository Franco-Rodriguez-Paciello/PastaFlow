using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using PastaFlow.Domain.Entities;
using PastaFlow.Infrastructure.Persistence;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;

namespace PastaFlow.API.Endpoints;

/// <summary>Cuerpo del request de login.</summary>
public sealed record LoginRequest(string Username, string Password);

/// <summary>Respuesta exitosa del login.</summary>
public sealed record LoginResponse(string Token, string Username, string Rol, DateTime Expiracion);

public static class AuthEndpoints
{
    public static IEndpointRouteBuilder MapAuthEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/auth");

        group.MapPost("/login", async (
            [FromBody] LoginRequest request,
            PastaFlowDbContext db,
            IConfiguration configuration,
            CancellationToken ct) =>
        {
            if (string.IsNullOrWhiteSpace(request.Username) || string.IsNullOrWhiteSpace(request.Password))
                return Results.BadRequest(new ProblemDetails
                {
                    Title = "Datos inválidos",
                    Detail = "Username y Password son requeridos.",
                    Status = StatusCodes.Status400BadRequest
                });

            var usuario = await db.Usuarios
                .AsNoTracking()
                .FirstOrDefaultAsync(u => u.Username == request.Username, ct);

            // Comparación con tiempo constante para prevenir timing attacks
            if (usuario is null || !BCrypt.Net.BCrypt.Verify(request.Password, usuario.PasswordHash))
                return Results.Unauthorized();

            var (token, expiracion) = GenerarJwtToken(usuario, configuration);

            return Results.Ok(new LoginResponse(token, usuario.Username, usuario.Rol, expiracion));
        })
        .WithName("Login")
        .WithSummary("Autentica un usuario y retorna un JWT válido por 8 horas")
        .Produces<LoginResponse>(StatusCodes.Status200OK)
        .Produces<ProblemDetails>(StatusCodes.Status400BadRequest)
        .Produces(StatusCodes.Status401Unauthorized)
        .AllowAnonymous();

        return app;
    }

    private static (string token, DateTime expiracion) GenerarJwtToken(Usuario usuario, IConfiguration configuration)
    {
        var jwtSection = configuration.GetSection("Jwt");
        var secretKey = jwtSection["SecretKey"]!;
        var expirationHours = jwtSection.GetValue<int>("ExpirationHours", 8);

        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secretKey));
        var credentials = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);
        var expiracion = DateTime.UtcNow.AddHours(expirationHours);

        var claims = new[]
        {
            new Claim(JwtRegisteredClaimNames.Sub,        usuario.Id.ToString()),
            new Claim(JwtRegisteredClaimNames.UniqueName, usuario.Username),
            new Claim(JwtRegisteredClaimNames.Jti,        Guid.NewGuid().ToString()),
            new Claim(ClaimTypes.Role,                    usuario.Rol)
        };

        var token = new JwtSecurityToken(
            issuer:            jwtSection["Issuer"],
            audience:          jwtSection["Audience"],
            claims:            claims,
            expires:           expiracion,
            signingCredentials: credentials);

        return (new JwtSecurityTokenHandler().WriteToken(token), expiracion);
    }
}

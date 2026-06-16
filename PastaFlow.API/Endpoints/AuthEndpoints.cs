using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PastaFlow.Application.Interfaces;
using PastaFlow.Infrastructure.Persistence;

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
            IJwtTokenGenerator tokenGenerator,
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

            var token = tokenGenerator.GenerateToken(usuario);
            var expirationHours = configuration.GetSection("Jwt").GetValue<int>("ExpirationHours", 8);
            var expiracion = DateTime.UtcNow.AddHours(expirationHours);

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
}

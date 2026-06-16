using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;
using PastaFlow.Application.Interfaces;
using PastaFlow.Domain;
using PastaFlow.Domain.Entities;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;

namespace PastaFlow.Infrastructure.Auth;

public sealed class JwtTokenGenerator(IConfiguration configuration) : IJwtTokenGenerator
{
    public string GenerateToken(Usuario usuario)
    {
        ArgumentNullException.ThrowIfNull(usuario);

        if (!Roles.IsValid(usuario.Rol))
            throw new InvalidOperationException(
                $"El rol '{usuario.Rol}' no es válido. Roles permitidos: {Roles.Admin}, {Roles.Operario}.");

        var jwtSection = configuration.GetSection("Jwt");
        var secretKey = ResolveSecretKey(jwtSection);
        var issuer = jwtSection["Issuer"]
            ?? throw new InvalidOperationException("Jwt:Issuer no está configurado.");
        var audience = jwtSection["Audience"]
            ?? throw new InvalidOperationException("Jwt:Audience no está configurado.");
        var expirationHours = jwtSection.GetValue<int>("ExpirationHours", 8);

        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secretKey));
        var credentials = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        var token = new JwtSecurityToken(
            issuer: issuer,
            audience: audience,
            claims: BuildClaims(usuario),
            expires: DateTime.UtcNow.AddHours(expirationHours),
            signingCredentials: credentials);

        return new JwtSecurityTokenHandler().WriteToken(token);
    }

    private static IEnumerable<Claim> BuildClaims(Usuario usuario)
    {
        var roleClaim = usuario.Rol switch
        {
            Roles.Admin    => Roles.Admin,
            Roles.Operario => Roles.Operario,
            _ => throw new InvalidOperationException($"Rol no reconocido: '{usuario.Rol}'.")
        };

        return
        [
            new Claim(JwtRegisteredClaimNames.Sub,        usuario.Id.ToString()),
            new Claim(JwtRegisteredClaimNames.UniqueName, usuario.Username),
            new Claim(JwtRegisteredClaimNames.Jti,        Guid.NewGuid().ToString()),
            new Claim(ClaimTypes.Role,                    roleClaim)
        ];
    }

    private static string ResolveSecretKey(IConfigurationSection jwtSection) =>
        Environment.GetEnvironmentVariable("Jwt__SecretKey")
        ?? jwtSection["SecretKey"]
        ?? throw new InvalidOperationException(
            "JWT SecretKey no está configurado. Definí la variable de entorno Jwt__SecretKey " +
            "o User Secrets antes de emitir tokens.");
}

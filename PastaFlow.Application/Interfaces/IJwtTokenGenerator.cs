using PastaFlow.Domain.Entities;

namespace PastaFlow.Application.Interfaces;

/// <summary>
/// Contrato para la emisión de JWT. La implementación concreta (claims + firma HMAC)
/// residirá en Infrastructure en el siguiente paso de la Fase 3.
/// </summary>
public interface IJwtTokenGenerator
{
    /// <summary>
    /// Genera un JWT firmado para el usuario autenticado.
    /// El claim de rol debe mapearse usando <see cref="Domain.Roles.Admin"/> o
    /// <see cref="Domain.Roles.Operario"/> según el rol almacenado en el usuario.
    /// </summary>
    string GenerateToken(Usuario usuario);
}

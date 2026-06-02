using FluentValidation;

namespace PastaFlow.Application.Commands.Produccion;

public sealed class RegistrarProduccionCommandValidator : AbstractValidator<RegistrarProduccionCommand>
{
    public RegistrarProduccionCommandValidator()
    {
        RuleFor(x => x.ProductoId)
            .GreaterThan(0)
            .WithMessage("El Id del producto debe ser mayor a 0.");

        RuleFor(x => x.CantidadProducida)
            .GreaterThan(0)
            .WithMessage("La cantidad producida debe ser mayor a 0.");
    }
}

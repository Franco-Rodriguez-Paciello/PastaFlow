using FluentValidation;

namespace PastaFlow.Application.Commands.Produccion;

public sealed class CrearOrdenProduccionCommandValidator : AbstractValidator<CrearOrdenProduccionCommand>
{
    public CrearOrdenProduccionCommandValidator()
    {
        RuleFor(x => x.ProductoId)
            .GreaterThan(0)
            .WithMessage("El Id del producto debe ser mayor a 0.");

        RuleFor(x => x.CantidadProducida)
            .GreaterThan(0)
            .WithMessage("La cantidad a producir debe ser mayor a 0.");
    }
}

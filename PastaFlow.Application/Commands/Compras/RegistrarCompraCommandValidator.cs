using FluentValidation;

namespace PastaFlow.Application.Commands.Compras;

public sealed class RegistrarCompraCommandValidator : AbstractValidator<RegistrarCompraCommand>
{
    public RegistrarCompraCommandValidator()
    {
        RuleFor(x => x.ProveedorId)
            .GreaterThan(0)
            .When(x => x.ProveedorId.HasValue)
            .WithMessage("El proveedor debe ser válido.");

        RuleFor(x => x.Lineas)
            .NotEmpty()
            .WithMessage("Agregá al menos un insumo a la compra.");

        RuleForEach(x => x.Lineas).ChildRules(linea =>
        {
            linea.RuleFor(l => l.IngredienteId)
                .GreaterThan(0)
                .WithMessage("El insumo debe ser válido.");

            linea.RuleFor(l => l.Cantidad)
                .GreaterThan(0)
                .WithMessage("La cantidad debe ser mayor a cero.");

            linea.RuleFor(l => l.PrecioUnitario)
                .GreaterThanOrEqualTo(0)
                .WithMessage("El precio unitario no puede ser negativo.");
        });
    }
}

using FluentValidation;

namespace PastaFlow.Application.DTOs;

public sealed class RegistrarVentaDtoValidator : AbstractValidator<RegistrarVentaDto>
{
    private static readonly HashSet<string> _metodosPagoValidos = ["Efectivo", "Transferencia"];

    public RegistrarVentaDtoValidator()
    {
        RuleFor(x => x.MetodoPago)
            .NotEmpty().WithMessage("El método de pago es obligatorio.")
            .Must(m => _metodosPagoValidos.Contains(m))
            .WithMessage("El método de pago debe ser 'Efectivo' o 'Transferencia'.");

        RuleFor(x => x.Items)
            .NotEmpty().WithMessage("La venta debe tener al menos un producto.");

        RuleForEach(x => x.Items).ChildRules(item =>
        {
            item.RuleFor(i => i.ProductoId)
                .GreaterThan(0).WithMessage("El ProductoId debe ser mayor a 0.");
            item.RuleFor(i => i.Cantidad)
                .GreaterThan(0).WithMessage("La cantidad debe ser mayor a 0.");
        });
    }
}

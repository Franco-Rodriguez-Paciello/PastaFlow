namespace PastaFlow.Application.Commands.Ventas;

public sealed record RegistrarVentaCommand(
    int UsuarioId,
    string MetodoPago,
    IReadOnlyCollection<ItemVentaCommand> Items
);

public sealed record ItemVentaCommand(
    int ProductoId,
    int Cantidad
);

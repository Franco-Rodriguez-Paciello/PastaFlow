using PastaFlow.Domain.Entities;

namespace PastaFlow.Application.Commands.Productos;

public sealed record RegistrarProductoCommand(
    string Nombre,
    string Descripcion,
    decimal PrecioVenta,
    TipoProducto TipoProducto);

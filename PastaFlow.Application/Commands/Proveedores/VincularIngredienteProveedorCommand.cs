namespace PastaFlow.Application.Commands.Proveedores;

public sealed record VincularIngredienteProveedorCommand(
    int ProveedorId,
    int IngredienteId,
    decimal PrecioReferencia,
    string? CodigoProveedor,
    bool EsPreferido,
    int? TiempoEntregaDias);

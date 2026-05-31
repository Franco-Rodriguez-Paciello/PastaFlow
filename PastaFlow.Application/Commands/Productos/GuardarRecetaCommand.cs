namespace PastaFlow.Application.Commands.Productos;

public sealed record NuevoProductoInput(
    string Nombre,
    string Descripcion,
    decimal PrecioVenta,
    bool ActivoParaTiendaOnline);

public sealed record GuardarRecetaCommand(
    bool EsProductoNuevo,
    int? ProductoId,
    NuevoProductoInput? DatosNuevoProducto,
    IReadOnlyCollection<IngredienteRecetaInput> Ingredientes);

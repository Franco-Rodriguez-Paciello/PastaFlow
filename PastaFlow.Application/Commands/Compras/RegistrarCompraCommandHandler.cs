using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using PastaFlow.Application.Interfaces;
using PastaFlow.Domain.Entities;

namespace PastaFlow.Application.Commands.Compras;

public sealed class RegistrarCompraCommandHandler(
    IPastaFlowDbContext context,
    ILogger<RegistrarCompraCommandHandler> logger)
{
    public async Task<int> HandleAsync(
        RegistrarCompraCommand command,
        CancellationToken cancellationToken = default)
    {
        if (command.Lineas.Count == 0)
            throw new ArgumentException("La compra debe tener al menos una línea.");

        int[] ingredienteIds = command.Lineas.Select(l => l.IngredienteId).Distinct().ToArray();
        if (ingredienteIds.Length != command.Lineas.Count)
            throw new InvalidOperationException("No se puede repetir el mismo insumo en una compra.");

        if (command.ProveedorId.HasValue)
        {
            bool proveedorExiste = await context.Proveedores
                .AsNoTracking()
                .AnyAsync(p => p.Id == command.ProveedorId.Value, cancellationToken);

            if (!proveedorExiste)
                throw new KeyNotFoundException($"No se encontró el proveedor con Id {command.ProveedorId}.");
        }

        await using var transaction = await context.BeginTransactionAsync(cancellationToken);

        try
        {
            var lineasDominio = command.Lineas
                .Select(l => new CompraLinea(l.IngredienteId, l.Cantidad, l.PrecioUnitario))
                .ToList();

            var compra = new Compra(
                command.ProveedorId,
                command.NumeroFactura,
                command.Observaciones,
                lineasDominio);

            context.Compras.Add(compra);

            Dictionary<int, Ingrediente> ingredientes = await context.Ingredientes
                .Where(i => ingredienteIds.Contains(i.Id))
                .ToDictionaryAsync(i => i.Id, cancellationToken);

            if (ingredientes.Count != ingredienteIds.Length)
            {
                int faltante = ingredienteIds.First(id => !ingredientes.ContainsKey(id));
                throw new KeyNotFoundException($"No se encontró el insumo con Id {faltante}.");
            }

            foreach (CompraLineaInput input in command.Lineas)
            {
                Ingrediente ingrediente = ingredientes[input.IngredienteId];
                ingrediente.SumarStock(input.Cantidad);

                if (command.ActualizarCosto && input.PrecioUnitario > 0)
                {
                    decimal costoAnterior = ingrediente.CostoActual;
                    ingrediente.ActualizarCosto(input.PrecioUnitario);

                    context.HistorialPreciosIngrediente.Add(new HistorialPrecioIngrediente(
                        ingrediente.Id,
                        costoAnterior,
                        input.PrecioUnitario));
                }
            }

            if (command.ProveedorId.HasValue)
            {
                foreach (CompraLineaInput input in command.Lineas)
                {
                    ProveedorIngrediente? vinculo = await context.ProveedorIngredientes
                        .FirstOrDefaultAsync(
                            pi => pi.ProveedorId == command.ProveedorId.Value
                                  && pi.IngredienteId == input.IngredienteId,
                            cancellationToken);

                    if (vinculo is not null && input.PrecioUnitario > 0)
                    {
                        vinculo.Actualizar(
                            input.PrecioUnitario,
                            vinculo.CodigoProveedor,
                            vinculo.EsPreferido,
                            vinculo.TiempoEntregaDias);
                    }
                }
            }

            await context.SaveChangesAsync(cancellationToken);
            await transaction.CommitAsync(cancellationToken);

            logger.LogInformation(
                "Compra registrada. CompraId={CompraId} Lineas={Lineas} Total={Total}",
                compra.Id,
                command.Lineas.Count,
                compra.Total);

            return compra.Id;
        }
        catch
        {
            await transaction.RollbackAsync(cancellationToken);
            throw;
        }
    }
}

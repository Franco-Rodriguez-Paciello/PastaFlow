using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using PastaFlow.Application.Interfaces;
using PastaFlow.Domain.Entities;

namespace PastaFlow.Application.Commands.Ingredientes;

public sealed class RegistrarAjusteManualCommandHandler
{
    private readonly IPastaFlowDbContext _context;
    private readonly ILogger<RegistrarAjusteManualCommandHandler> _logger;

    public RegistrarAjusteManualCommandHandler(
        IPastaFlowDbContext context,
        ILogger<RegistrarAjusteManualCommandHandler> logger)
    {
        _context = context;
        _logger = logger;
    }

    public async Task<int> HandleAsync(
        RegistrarAjusteManualCommand command,
        CancellationToken cancellationToken = default)
    {
        ArgumentOutOfRangeException.ThrowIfNegativeOrZero(command.InsumoId, nameof(command.InsumoId));
        ArgumentOutOfRangeException.ThrowIfNegativeOrZero(command.Cantidad, nameof(command.Cantidad));

        await using var transaction =
            await _context.BeginTransactionAsync(cancellationToken);

        try
        {
            // 1. Buscar el insumo
            Ingrediente? insumo = await _context.Ingredientes
                .FirstOrDefaultAsync(i => i.Id == command.InsumoId, cancellationToken);

            if (insumo is null)
                throw new KeyNotFoundException(
                    $"No se encontró un insumo con el Id {command.InsumoId}.");

            decimal stockAnterior = insumo.StockActual;

            // 2. Aplicar el ajuste sobre el stock del insumo
            if (command.TipoAjuste == TipoAjuste.Suma)
            {
                insumo.SumarStock(command.Cantidad);
            }
            else
            {
                // RestarStock lanza InvalidDomainOperationException si el resultado sería negativo
                insumo.RestarStock(command.Cantidad);
            }

            // 3. Registrar la auditoría
            var ajuste = new AjusteStock(
                command.InsumoId,
                command.Cantidad,
                command.TipoAjuste,
                command.Motivo,
                command.Observaciones);

            _context.AjustesStock.Add(ajuste);

            // 4. Persistir dentro de la transacción
            await _context.SaveChangesAsync(cancellationToken);
            await transaction.CommitAsync(cancellationToken);

            _logger.LogInformation(
                "Ajuste de stock registrado. InsumoId={InsumoId} Tipo={Tipo} Cantidad={Cantidad} " +
                "StockAnterior={Anterior} StockNuevo={Nuevo}",
                command.InsumoId, command.TipoAjuste, command.Cantidad,
                stockAnterior, insumo.StockActual);

            return ajuste.Id;
        }
        catch
        {
            await transaction.RollbackAsync(cancellationToken);
            throw;
        }
    }
}

using Microsoft.EntityFrameworkCore;
using PastaFlow.Application.Interfaces;
using PastaFlow.Domain.Entities;

namespace PastaFlow.Application.Commands.Ingredientes;

public sealed class ActualizarCostoIngredienteCommandHandler
{
    private readonly IPastaFlowDbContext _context;

    public ActualizarCostoIngredienteCommandHandler(IPastaFlowDbContext context)
    {
        _context = context;
    }

    public async Task HandleAsync(
        ActualizarCostoIngredienteCommand command,
        CancellationToken cancellationToken = default)
    {
        // 1. Buscar el ingrediente por su PK
        Ingrediente? ingrediente = await _context.Ingredientes
            .FirstOrDefaultAsync(i => i.Id == command.IngredienteId, cancellationToken);

        if (ingrediente is null)
            throw new KeyNotFoundException(
                $"No se encontró un ingrediente con el ID '{command.IngredienteId}'.");

        // 2. Capturar el costo anterior antes de modificar la entidad
        decimal costoAnterior = ingrediente.CostoActual;

        // 3. Delegar la mutación de estado al método de dominio
        //    (valida el nuevo costo y actualiza UltimaActualizacionCosto internamente)
        ingrediente.ActualizarCosto(command.NuevoCosto);

        // 4. Registrar la entrada de auditoría en el historial
        var historial = new HistorialPrecioIngrediente(
            ingredienteId: ingrediente.Id,
            precioCostoAnterior: costoAnterior,
            precioCostoNuevo: command.NuevoCosto);
        _context.HistorialPreciosIngrediente.Add(historial);

        // 5. Única operación de escritura: UPDATE + INSERT en la misma transacción implícita
        await _context.SaveChangesAsync(cancellationToken);
    }
}

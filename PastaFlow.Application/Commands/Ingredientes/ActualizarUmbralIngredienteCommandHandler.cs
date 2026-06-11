using Microsoft.EntityFrameworkCore;
using PastaFlow.Application.Interfaces;
using PastaFlow.Domain.Entities;

namespace PastaFlow.Application.Commands.Ingredientes;

public sealed class ActualizarUmbralIngredienteCommandHandler
{
    private readonly IPastaFlowDbContext _context;

    public ActualizarUmbralIngredienteCommandHandler(IPastaFlowDbContext context)
    {
        _context = context;
    }

    public async Task HandleAsync(
        ActualizarUmbralIngredienteCommand command,
        CancellationToken cancellationToken = default)
    {
        Ingrediente? ingrediente = await _context.Ingredientes
            .FirstOrDefaultAsync(i => i.Id == command.IngredienteId, cancellationToken);

        if (ingrediente is null)
            throw new KeyNotFoundException(
                $"No se encontró un ingrediente con el ID '{command.IngredienteId}'.");

        ingrediente.SetUmbralCritico(command.NuevoUmbral);

        await _context.SaveChangesAsync(cancellationToken);
    }
}

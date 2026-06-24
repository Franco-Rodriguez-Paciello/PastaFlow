using Microsoft.EntityFrameworkCore;
using PastaFlow.Application.Interfaces;

namespace PastaFlow.Application.Commands.Dashboard;

public sealed class EliminarComprasInsightCommandHandler(IPastaFlowDbContext context)
{
    public async Task HandleAsync(
        EliminarComprasInsightCommand command,
        CancellationToken cancellationToken = default)
    {
        var informe = await context.InformesComprasInsight
            .FirstOrDefaultAsync(i => i.Id == command.Id, cancellationToken)
            ?? throw new KeyNotFoundException($"Informe de compras con id {command.Id} no encontrado.");

        context.InformesComprasInsight.Remove(informe);
        await context.SaveChangesAsync(cancellationToken);
    }
}

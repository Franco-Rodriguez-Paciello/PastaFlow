using Microsoft.EntityFrameworkCore;
using PastaFlow.Domain.Entities;

namespace PastaFlow.Application.Interfaces;

public interface IPastaFlowDbContext
{
    DbSet<Producto> Productos { get; }
    DbSet<Ingrediente> Ingredientes { get; }
    DbSet<RecetaIngrediente> RecetaIngredientes { get; }
    DbSet<HistorialPrecioIngrediente> HistorialPreciosIngrediente { get; }

    Task<int> SaveChangesAsync(CancellationToken cancellationToken = default);
}

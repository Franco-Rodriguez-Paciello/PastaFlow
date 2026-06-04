using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Storage;
using PastaFlow.Domain.Entities;

namespace PastaFlow.Application.Interfaces;

public interface IPastaFlowDbContext
{
    DbSet<Producto> Productos { get; }
    DbSet<Ingrediente> Ingredientes { get; }
    DbSet<RecetaIngrediente> RecetaIngredientes { get; }
    DbSet<HistorialPrecioIngrediente> HistorialPreciosIngrediente { get; }
    DbSet<HistorialProduccion> HistorialProduccion { get; }
    DbSet<AjusteStock> AjustesStock { get; }
    DbSet<Usuario> Usuarios { get; }
    DbSet<Venta> Ventas { get; }
    DbSet<DetalleVenta> DetallesVenta { get; }

    Task<int> SaveChangesAsync(CancellationToken cancellationToken = default);
    Task<IDbContextTransaction> BeginTransactionAsync(CancellationToken cancellationToken = default);
}

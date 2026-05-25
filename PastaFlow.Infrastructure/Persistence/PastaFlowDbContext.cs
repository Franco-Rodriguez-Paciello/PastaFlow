using Microsoft.EntityFrameworkCore;
using PastaFlow.Application.Interfaces;
using PastaFlow.Domain.Entities;

namespace PastaFlow.Infrastructure.Persistence;

public class PastaFlowDbContext : DbContext, IPastaFlowDbContext
{
    public PastaFlowDbContext(DbContextOptions<PastaFlowDbContext> options) : base(options) { }

    public DbSet<Producto> Productos => Set<Producto>();
    public DbSet<Ingrediente> Ingredientes => Set<Ingrediente>();
    public DbSet<RecetaIngrediente> RecetaIngredientes => Set<RecetaIngrediente>();
    public DbSet<HistorialPrecioIngrediente> HistorialPreciosIngrediente => Set<HistorialPrecioIngrediente>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.ApplyConfigurationsFromAssembly(typeof(PastaFlowDbContext).Assembly);
        base.OnModelCreating(modelBuilder);
    }
}

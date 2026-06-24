using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Storage;
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
    public DbSet<HistorialProduccion> HistorialProduccion => Set<HistorialProduccion>();
    public DbSet<AjusteStock> AjustesStock => Set<AjusteStock>();
    public DbSet<Usuario> Usuarios => Set<Usuario>();
    public DbSet<Venta> Ventas => Set<Venta>();
    public DbSet<DetalleVenta> DetallesVenta => Set<DetalleVenta>();
    public DbSet<InformeComprasInsight> InformesComprasInsight => Set<InformeComprasInsight>();
    public DbSet<Proveedor> Proveedores => Set<Proveedor>();
    public DbSet<ProveedorIngrediente> ProveedorIngredientes => Set<ProveedorIngrediente>();

    public Task<IDbContextTransaction> BeginTransactionAsync(CancellationToken cancellationToken = default)
        => Database.BeginTransactionAsync(cancellationToken);

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.ApplyConfigurationsFromAssembly(typeof(PastaFlowDbContext).Assembly);
        base.OnModelCreating(modelBuilder);
    }
}

using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Storage;
using PastaFlow.Application.Interfaces;
using PastaFlow.Domain.Entities;

namespace PastaFlow.Tests.Infrastructure;

/// <summary>
/// DbContext en memoria para pruebas unitarias. Implementa IPastaFlowDbContext
/// reemplazando la transacción real de base de datos por una no-operación (NoOp)
/// compatible con el proveedor InMemory de EF Core.
/// </summary>
public sealed class TestDbContext : DbContext, IPastaFlowDbContext
{
    public TestDbContext(DbContextOptions<TestDbContext> options) : base(options) { }

    public DbSet<Producto> Productos => Set<Producto>();
    public DbSet<Ingrediente> Ingredientes => Set<Ingrediente>();
    public DbSet<RecetaIngrediente> RecetaIngredientes => Set<RecetaIngrediente>();
    public DbSet<HistorialPrecioIngrediente> HistorialPreciosIngrediente => Set<HistorialPrecioIngrediente>();
    public DbSet<HistorialProduccion> HistorialProduccion => Set<HistorialProduccion>();
    public DbSet<AjusteStock> AjustesStock => Set<AjusteStock>();
    public DbSet<Usuario> Usuarios => Set<Usuario>();

    /// <summary>
    /// Retorna una transacción no-operación. El proveedor InMemory no soporta
    /// transacciones reales, pero el handler las exige; esta implementación
    /// satisface la interfaz sin efectos secundarios.
    /// </summary>
    public Task<IDbContextTransaction> BeginTransactionAsync(CancellationToken cancellationToken = default)
        => Task.FromResult<IDbContextTransaction>(new NoOpTransaction());

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        // Clave primaria compuesta para RecetaIngrediente
        modelBuilder.Entity<RecetaIngrediente>()
            .HasKey(ri => new { ri.ProductoId, ri.IngredienteId });

        // Relación RecetaIngrediente → Producto
        modelBuilder.Entity<RecetaIngrediente>()
            .HasOne(ri => ri.Producto)
            .WithMany(p => p.Receta)
            .HasForeignKey(ri => ri.ProductoId);

        // Relación RecetaIngrediente → Ingrediente
        modelBuilder.Entity<RecetaIngrediente>()
            .HasOne(ri => ri.Ingrediente)
            .WithMany()
            .HasForeignKey(ri => ri.IngredienteId);

        // HistorialProduccion → Producto
        modelBuilder.Entity<HistorialProduccion>()
            .HasOne(h => h.Producto)
            .WithMany()
            .HasForeignKey(h => h.ProductoId);

        base.OnModelCreating(modelBuilder);
    }
}

/// <summary>
/// Implementación no-operación de IDbContextTransaction para tests con InMemory.
/// </summary>
internal sealed class NoOpTransaction : IDbContextTransaction
{
    public Guid TransactionId { get; } = Guid.NewGuid();

    public void Commit() { }
    public Task CommitAsync(CancellationToken cancellationToken = default) => Task.CompletedTask;

    public void Rollback() { }
    public Task RollbackAsync(CancellationToken cancellationToken = default) => Task.CompletedTask;

    public void Dispose() { }
    public ValueTask DisposeAsync() => ValueTask.CompletedTask;
}

using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using PastaFlow.Domain.Entities;

namespace PastaFlow.Infrastructure.Persistence.Configurations;

public class CompraConfiguration : IEntityTypeConfiguration<Compra>
{
    public void Configure(EntityTypeBuilder<Compra> builder)
    {
        builder.HasKey(c => c.Id);

        builder.Property(c => c.FechaIngreso)
            .IsRequired();

        builder.Property(c => c.NumeroFactura)
            .HasMaxLength(50);

        builder.Property(c => c.Observaciones)
            .HasMaxLength(500);

        builder.Property(c => c.Total)
            .IsRequired()
            .HasPrecision(18, 4);

        builder.HasOne(c => c.Proveedor)
            .WithMany()
            .HasForeignKey(c => c.ProveedorId)
            .OnDelete(DeleteBehavior.SetNull);

        builder.HasMany(c => c.Lineas)
            .WithOne(l => l.Compra)
            .HasForeignKey(l => l.CompraId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}

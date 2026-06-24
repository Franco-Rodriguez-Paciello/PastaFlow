using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using PastaFlow.Domain.Entities;

namespace PastaFlow.Infrastructure.Persistence.Configurations;

public class ProveedorIngredienteConfiguration : IEntityTypeConfiguration<ProveedorIngrediente>
{
    public void Configure(EntityTypeBuilder<ProveedorIngrediente> builder)
    {
        builder.HasKey(pi => new { pi.ProveedorId, pi.IngredienteId });

        builder.Property(pi => pi.CodigoProveedor)
            .HasMaxLength(50);

        builder.Property(pi => pi.PrecioReferencia)
            .IsRequired()
            .HasPrecision(18, 4);

        builder.Property(pi => pi.EsPreferido)
            .IsRequired()
            .HasDefaultValue(false);

        builder.HasOne(pi => pi.Proveedor)
            .WithMany(p => p.Ingredientes)
            .HasForeignKey(pi => pi.ProveedorId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(pi => pi.Ingrediente)
            .WithMany()
            .HasForeignKey(pi => pi.IngredienteId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}

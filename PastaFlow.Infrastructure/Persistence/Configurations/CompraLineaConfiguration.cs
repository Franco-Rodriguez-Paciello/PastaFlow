using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using PastaFlow.Domain.Entities;

namespace PastaFlow.Infrastructure.Persistence.Configurations;

public class CompraLineaConfiguration : IEntityTypeConfiguration<CompraLinea>
{
    public void Configure(EntityTypeBuilder<CompraLinea> builder)
    {
        builder.HasKey(l => l.Id);

        builder.Property(l => l.Cantidad)
            .IsRequired()
            .HasPrecision(18, 4);

        builder.Property(l => l.PrecioUnitario)
            .IsRequired()
            .HasPrecision(18, 4);

        builder.Property(l => l.Subtotal)
            .IsRequired()
            .HasPrecision(18, 4);

        builder.HasOne(l => l.Ingrediente)
            .WithMany()
            .HasForeignKey(l => l.IngredienteId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}

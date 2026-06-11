using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using PastaFlow.Domain.Entities;

namespace PastaFlow.Infrastructure.Persistence.Configurations;

public class HistorialProduccionConfiguration : IEntityTypeConfiguration<HistorialProduccion>
{
    public void Configure(EntityTypeBuilder<HistorialProduccion> builder)
    {
        builder.HasKey(h => h.Id);

        builder.Property(h => h.ProductoId)
            .IsRequired();

        builder.Property(h => h.CantidadProducida)
            .IsRequired()
            .HasPrecision(18, 4);

        builder.Property(h => h.CostoTotalReal)
            .IsRequired()
            .HasPrecision(18, 4);

        builder.Property(h => h.CostoUnitarioReal)
            .IsRequired()
            .HasPrecision(18, 4);

        builder.Property(h => h.FechaDeRegistro)
            .IsRequired();

        builder.HasOne(h => h.Producto)
            .WithMany()
            .HasForeignKey(h => h.ProductoId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}

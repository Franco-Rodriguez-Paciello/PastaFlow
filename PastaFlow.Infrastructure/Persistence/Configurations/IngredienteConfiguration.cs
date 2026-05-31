using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using PastaFlow.Domain.Entities;

namespace PastaFlow.Infrastructure.Persistence.Configurations;

public class IngredienteConfiguration : IEntityTypeConfiguration<Ingrediente>
{
    public void Configure(EntityTypeBuilder<Ingrediente> builder)
    {
        builder.HasKey(i => i.Id);

        builder.Property(i => i.Nombre)
            .IsRequired()
            .HasMaxLength(150);

        builder.Property(i => i.UnidadMedida)
            .IsRequired()
            .HasConversion<string>();

        builder.Property(i => i.CostoActual)
            .IsRequired()
            .HasPrecision(18, 4);

        builder.Property(i => i.StockActual)
            .IsRequired()
            .HasPrecision(18, 4)
            .HasDefaultValue(0m);

        builder.Property(i => i.UmbralCritico)
            .IsRequired()
            .HasPrecision(18, 4)
            .HasDefaultValue(5m);

        builder.Property(i => i.UltimaActualizacionCosto)
            .IsRequired();
    }
}

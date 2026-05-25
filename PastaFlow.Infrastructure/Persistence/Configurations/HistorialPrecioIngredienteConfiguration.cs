using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using PastaFlow.Domain.Entities;

namespace PastaFlow.Infrastructure.Persistence.Configurations;

public class HistorialPrecioIngredienteConfiguration : IEntityTypeConfiguration<HistorialPrecioIngrediente>
{
    public void Configure(EntityTypeBuilder<HistorialPrecioIngrediente> builder)
    {
        builder.HasKey(h => h.Id);

        builder.Property(h => h.PrecioCostoAnterior)
            .IsRequired()
            .HasPrecision(18, 4);

        builder.Property(h => h.PrecioCostoNuevo)
            .IsRequired()
            .HasPrecision(18, 4);

        builder.Property(h => h.FechaRegistro)
            .IsRequired();

        // Relación muchos a uno con Ingrediente (Cascade: historial se borra con el ingrediente)
        builder.HasOne(h => h.Ingrediente)
            .WithMany()
            .HasForeignKey(h => h.IngredienteId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}

using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using PastaFlow.Domain.Entities;

namespace PastaFlow.Infrastructure.Persistence.Configurations;

public class RecetaIngredienteConfiguration : IEntityTypeConfiguration<RecetaIngrediente>
{
    public void Configure(EntityTypeBuilder<RecetaIngrediente> builder)
    {
        // Clave primaria compuesta
        builder.HasKey(ri => new { ri.ProductoId, ri.IngredienteId });

        builder.Property(ri => ri.CantidadRequerida)
            .IsRequired()
            .HasPrecision(18, 4);

        // Relación con Producto → colección Receta
        builder.HasOne(ri => ri.Producto)
            .WithMany(p => p.Receta)
            .HasForeignKey(ri => ri.ProductoId)
            .OnDelete(DeleteBehavior.Cascade);

        // Relación con Ingrediente (Restrict: no se puede borrar un ingrediente en uso)
        builder.HasOne(ri => ri.Ingrediente)
            .WithMany()
            .HasForeignKey(ri => ri.IngredienteId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}

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

        // --- Control de Concurrencia Optimista (xmin) ---
        // 'xmin' es una columna de sistema de PostgreSQL que contiene el ID de la
        // transacción que insertó/actualizó la fila por última vez. Nunca se repite
        // dentro del ciclo de vida de una fila, lo que la convierte en el token de
        // concurrencia más liviano y confiable disponible en PostgreSQL sin costo alguno.
        //
        // IsRowVersion() = ValueGeneratedOnAddOrUpdate() + IsConcurrencyToken()
        // EF Core añade automáticamente "WHERE xmin = @p_original" en cada UPDATE/DELETE,
        // lanzando DbUpdateConcurrencyException si otro proceso modificó la fila primero.
        builder.Property(i => i.Version)
            .HasColumnName("xmin")
            .HasColumnType("xid")
            .IsRowVersion();
    }
}

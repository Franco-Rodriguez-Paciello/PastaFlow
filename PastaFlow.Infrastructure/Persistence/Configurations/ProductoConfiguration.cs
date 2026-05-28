using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using PastaFlow.Domain.Entities;

namespace PastaFlow.Infrastructure.Persistence.Configurations;

public class ProductoConfiguration : IEntityTypeConfiguration<Producto>
{
    public void Configure(EntityTypeBuilder<Producto> builder)
    {
        builder.HasKey(p => p.Id);

        builder.Property(p => p.Nombre)
            .IsRequired()
            .HasMaxLength(200);

        builder.Property(p => p.Descripcion)
            .IsRequired()
            .HasMaxLength(500);

        builder.Property(p => p.PrecioVenta)
            .IsRequired()
            .HasPrecision(18, 4);

        builder.Property(p => p.StockActual)
            .IsRequired()
            .HasPrecision(18, 4);

        builder.Property(p => p.TipoProducto)
            .IsRequired()
            .HasConversion<int>();

        builder.Property(p => p.ActivoParaTiendaOnline)
            .IsRequired();
    }
}

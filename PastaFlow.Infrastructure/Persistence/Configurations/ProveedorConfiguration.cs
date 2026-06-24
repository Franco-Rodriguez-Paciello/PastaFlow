using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using PastaFlow.Domain.Entities;

namespace PastaFlow.Infrastructure.Persistence.Configurations;

public class ProveedorConfiguration : IEntityTypeConfiguration<Proveedor>
{
    public void Configure(EntityTypeBuilder<Proveedor> builder)
    {
        builder.HasKey(p => p.Id);

        builder.Property(p => p.Nombre)
            .IsRequired()
            .HasMaxLength(150);

        builder.HasIndex(p => p.Nombre)
            .IsUnique();

        builder.Property(p => p.ContactoNombre)
            .HasMaxLength(120);

        builder.Property(p => p.Telefono)
            .HasMaxLength(40);

        builder.Property(p => p.Email)
            .HasMaxLength(120);

        builder.Property(p => p.Cuit)
            .HasMaxLength(20);

        builder.Property(p => p.Notas)
            .HasMaxLength(500);

        builder.Property(p => p.Activo)
            .IsRequired()
            .HasDefaultValue(true);
    }
}

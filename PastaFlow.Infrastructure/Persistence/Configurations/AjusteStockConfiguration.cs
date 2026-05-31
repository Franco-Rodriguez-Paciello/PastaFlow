using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using PastaFlow.Domain.Entities;

namespace PastaFlow.Infrastructure.Persistence.Configurations;

public class AjusteStockConfiguration : IEntityTypeConfiguration<AjusteStock>
{
    public void Configure(EntityTypeBuilder<AjusteStock> builder)
    {
        builder.HasKey(a => a.Id);

        builder.Property(a => a.Cantidad)
            .IsRequired()
            .HasPrecision(18, 4);

        builder.Property(a => a.TipoAjuste)
            .IsRequired()
            .HasConversion<string>()
            .HasMaxLength(20);

        builder.Property(a => a.Motivo)
            .IsRequired()
            .HasConversion<string>()
            .HasMaxLength(30);

        builder.Property(a => a.Observaciones)
            .HasMaxLength(500);

        builder.Property(a => a.FechaRegistro)
            .IsRequired();

        builder.HasOne(a => a.Insumo)
            .WithMany()
            .HasForeignKey(a => a.InsumoId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}

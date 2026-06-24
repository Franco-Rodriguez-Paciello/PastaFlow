using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using PastaFlow.Domain.Entities;

namespace PastaFlow.Infrastructure.Persistence.Configurations;

public class InformeComprasInsightConfiguration : IEntityTypeConfiguration<InformeComprasInsight>
{
    public void Configure(EntityTypeBuilder<InformeComprasInsight> builder)
    {
        builder.HasKey(i => i.Id);

        builder.Property(i => i.Reporte)
            .IsRequired()
            .HasColumnType("text");

        builder.Property(i => i.GeneradoEnUtc)
            .IsRequired();

        builder.Property(i => i.Origen)
            .IsRequired()
            .HasConversion<string>()
            .HasMaxLength(20);

        builder.Property(i => i.DiaOperativo)
            .IsRequired()
            .HasMaxLength(10);

        builder.HasIndex(i => i.GeneradoEnUtc);
        builder.HasIndex(i => new { i.Origen, i.DiaOperativo });
    }
}

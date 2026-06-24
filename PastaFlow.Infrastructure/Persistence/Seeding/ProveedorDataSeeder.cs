using Microsoft.EntityFrameworkCore;
using PastaFlow.Domain.Entities;
using PastaFlow.Infrastructure.Persistence;

namespace PastaFlow.Infrastructure.Persistence.Seeding;

public static class ProveedorDataSeeder
{
    public static async Task SeedAsync(PastaFlowDbContext context, CancellationToken cancellationToken = default)
    {
        if (await context.Proveedores.AnyAsync(cancellationToken))
            return;

        var ingredientes = await context.Ingredientes
            .AsNoTracking()
            .Select(i => new { i.Id, i.Nombre, i.CostoActual })
            .ToListAsync(cancellationToken);

        var proveedores = new[]
        {
            new ProveedorSeed(
                "Molinos Alvear S.A.",
                "Carlos Méndez",
                "11-4523-8890",
                "ventas@molinosalvear.com.ar",
                "30-71234567-8",
                "Entrega martes y viernes. Bolsa x 25 kg.",
                [
                    new LinkSeed("harina", "HAR-0000-25", 1.05m, true, 2),
                    new LinkSeed("semola", "SEM-EXTRA", 1.08m, false, 3),
                ]),
            new ProveedorSeed(
                "Lácteos del Valle",
                "Mariana Ruiz",
                "11-5567-2211",
                "pedidos@lacteosdelvalle.com.ar",
                "30-65432109-1",
                "Requiere pedido con 48 h de anticipación.",
                [
                    new LinkSeed("queso", "RIC-500", 1.02m, true, 1),
                    new LinkSeed("ricota", "RIC-FRES", 1.0m, true, 1),
                    new LinkSeed("huevo", "HUE-JUM", 1.0m, false, 1),
                ]),
            new ProveedorSeed(
                "Verdulería Mayorista San Martín",
                "Jorge Peralta",
                "11-3344-9900",
                null,
                "20-28987654-3",
                "Solo entrega por la mañana.",
                [
                    new LinkSeed("espinaca", "ESP-MAY", 1.0m, true, 1),
                    new LinkSeed("acelga", "ACE-MAY", 1.0m, true, 1),
                ]),
            new ProveedorSeed(
                "Distribuidora Insumos PastaFlow",
                "Laura Giménez",
                "11-7788-4455",
                "compras@distripasta.com.ar",
                "30-99887766-5",
                "Proveedor general de aceite, sal y condimentos.",
                [
                    new LinkSeed("aceite", "ACE-GIR-5L", 1.03m, true, 2),
                    new LinkSeed("sal", "SAL-FIN-1K", 1.0m, true, 2),
                ]),
        };

        foreach (ProveedorSeed seed in proveedores)
        {
            var proveedor = new Proveedor(
                seed.Nombre,
                seed.ContactoNombre,
                seed.Telefono,
                seed.Email,
                seed.Cuit,
                seed.Notas);

            context.Proveedores.Add(proveedor);
            await context.SaveChangesAsync(cancellationToken);

            foreach (LinkSeed link in seed.Links)
            {
                var ingrediente = ingredientes.FirstOrDefault(i =>
                    i.Nombre.Contains(link.Keyword, StringComparison.OrdinalIgnoreCase));

                if (ingrediente is null)
                    continue;

                context.ProveedorIngredientes.Add(new ProveedorIngrediente(
                    proveedor.Id,
                    ingrediente.Id,
                    Math.Round(ingrediente.CostoActual * link.PrecioFactor, 4),
                    link.CodigoProveedor,
                    link.EsPreferido,
                    link.TiempoEntregaDias));
            }
        }

        await context.SaveChangesAsync(cancellationToken);
    }

    private sealed record ProveedorSeed(
        string Nombre,
        string? ContactoNombre,
        string? Telefono,
        string? Email,
        string? Cuit,
        string? Notas,
        LinkSeed[] Links);

    private sealed record LinkSeed(
        string Keyword,
        string CodigoProveedor,
        decimal PrecioFactor,
        bool EsPreferido,
        int TiempoEntregaDias);
}

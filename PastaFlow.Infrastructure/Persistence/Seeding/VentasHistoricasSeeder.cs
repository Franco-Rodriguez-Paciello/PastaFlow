using Microsoft.EntityFrameworkCore;
using PastaFlow.Domain.Entities;
using PastaFlow.Infrastructure.Persistence;

namespace PastaFlow.Infrastructure.Persistence.Seeding;

/// <summary>
/// Genera ventas históricas de mostrador con patrones de demanda plantados
/// (día 29 = ñoquis, fines de semana, días fríos/lluviosos + ruido) para poder
/// desarrollar y demostrar la predicción de demanda sin datos productivos reales.
///
/// Solo se ejecuta en Development y únicamente si no existen ventas previas.
/// </summary>
public static class VentasHistoricasSeeder
{
    private const int MesesHaciaAtras = 6;
    private const int SemillaDeterminista = 20260629;

    public static async Task SeedAsync(PastaFlowDbContext context, CancellationToken cancellationToken = default)
    {
        if (await context.Ventas.AnyAsync(cancellationToken))
            return;

        int? usuarioId = await context.Usuarios
            .OrderBy(u => u.Id)
            .Select(u => (int?)u.Id)
            .FirstOrDefaultAsync(cancellationToken);

        if (usuarioId is null)
        {
            Console.WriteLine("[VentasHistoricasSeeder] No hay usuarios; se omite la generación de ventas.");
            return;
        }

        var productos = await context.Productos
            .AsNoTracking()
            .Where(p => p.PrecioVenta > 0)
            .Select(p => new ProductoInfo(p.Id, p.Nombre, p.PrecioVenta))
            .ToListAsync(cancellationToken);

        if (productos.Count == 0)
        {
            Console.WriteLine("[VentasHistoricasSeeder] No hay productos con precio; se omite la generación de ventas.");
            return;
        }

        var rng = new Random(SemillaDeterminista);
        DateOnly hoy = DateOnly.FromDateTime(DateTime.UtcNow);
        DateOnly desde = hoy.AddMonths(-MesesHaciaAtras);

        var ventas = new List<Venta>();

        for (DateOnly dia = desde; dia <= hoy; dia = dia.AddDays(1))
        {
            bool esFinDeSemana = dia.DayOfWeek is DayOfWeek.Saturday or DayOfWeek.Sunday;
            bool esFrioOLluvia = EsDiaFrioOLluvioso(dia);
            bool esDia29 = dia.Day == 29;

            double[] pesos = CalcularPesos(productos, esDia29, esFrioOLluvia);

            int tickets = CalcularTickets(esFinDeSemana, esFrioOLluvia, rng);

            for (int t = 0; t < tickets; t++)
            {
                int lineas = rng.Next(1, 3); // 1 o 2 productos por ticket
                var detalles = new List<DetalleVenta>();
                var productosEnTicket = new HashSet<int>();

                for (int l = 0; l < lineas; l++)
                {
                    ProductoInfo prod = ElegirPonderado(productos, pesos, rng);
                    if (!productosEnTicket.Add(prod.Id))
                        continue;

                    int cantidad = rng.Next(1, 4); // 1 a 3 kg
                    detalles.Add(new DetalleVenta(prod.Id, cantidad, prod.Precio));
                }

                if (detalles.Count == 0)
                    continue;

                string metodoPago = rng.NextDouble() < 0.7 ? "Efectivo" : "Transferencia";
                DateTime fechaUtc = ConstruirFechaUtc(dia, rng);

                ventas.Add(Venta.Importar(usuarioId.Value, metodoPago, fechaUtc, detalles));
            }
        }

        context.Ventas.AddRange(ventas);
        await context.SaveChangesAsync(cancellationToken);

        Console.WriteLine(
            $"[VentasHistoricasSeeder] Se generaron {ventas.Count} ventas históricas " +
            $"({desde:yyyy-MM-dd} → {hoy:yyyy-MM-dd}).");
    }

    private static double[] CalcularPesos(
        IReadOnlyList<ProductoInfo> productos,
        bool esDia29,
        bool esFrioOLluvia)
    {
        var pesos = new double[productos.Count];

        for (int i = 0; i < productos.Count; i++)
        {
            double peso = 1.0;
            bool esNoqui = EsNoqui(productos[i].Nombre);

            if (esNoqui && esDia29)
                peso *= 4.0;

            if (esNoqui && esFrioOLluvia)
                peso *= 1.8;

            if (esFrioOLluvia && EsPastaReconfortante(productos[i].Nombre))
                peso *= 1.4;

            pesos[i] = peso;
        }

        return pesos;
    }

    private static int CalcularTickets(bool esFinDeSemana, bool esFrioOLluvia, Random rng)
    {
        int baseTickets = esFinDeSemana ? rng.Next(14, 24) : rng.Next(6, 13);

        if (esFrioOLluvia)
            baseTickets = (int)Math.Round(baseTickets * 1.3);

        return baseTickets;
    }

    private static ProductoInfo ElegirPonderado(
        IReadOnlyList<ProductoInfo> productos,
        double[] pesos,
        Random rng)
    {
        double total = 0;
        foreach (double p in pesos)
            total += p;

        double objetivo = rng.NextDouble() * total;
        double acumulado = 0;

        for (int i = 0; i < productos.Count; i++)
        {
            acumulado += pesos[i];
            if (objetivo <= acumulado)
                return productos[i];
        }

        return productos[^1];
    }

    /// <summary>
    /// Marca de forma determinista (reproducible) si un día fue frío o lluvioso,
    /// con más probabilidad en los meses de invierno del hemisferio sur.
    /// </summary>
    private static bool EsDiaFrioOLluvioso(DateOnly dia)
    {
        double probabilidad = dia.Month switch
        {
            6 or 7 or 8 => 0.5,
            5 or 9 => 0.3,
            _ => 0.12
        };

        var rng = new Random(HashCode.Combine(dia.Year, dia.Month, dia.Day));
        return rng.NextDouble() < probabilidad;
    }

    private static DateTime ConstruirFechaUtc(DateOnly dia, Random rng)
    {
        int hora = rng.Next(9, 21);
        int minuto = rng.Next(0, 60);
        var local = new DateTime(dia.Year, dia.Month, dia.Day, hora, minuto, 0, DateTimeKind.Utc);
        return local;
    }

    private static bool EsNoqui(string nombre)
    {
        string n = nombre.ToLowerInvariant();
        return n.Contains("ñoqui") || n.Contains("noqui") || n.Contains("gnocch");
    }

    private static bool EsPastaReconfortante(string nombre)
    {
        string n = nombre.ToLowerInvariant();
        return n.Contains("sorrentino")
            || n.Contains("raviol")
            || n.Contains("canelon")
            || n.Contains("lasagn")
            || n.Contains("lasaña");
    }

    private sealed record ProductoInfo(int Id, string Nombre, decimal Precio);
}

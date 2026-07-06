using PastaFlow.Domain.Entities;

namespace PastaFlow.Tests.Infrastructure;

internal static class VentasTestHelper
{
    public static async Task<int> SeedProductoAsync(TestDbContext context, string nombre = "Ñoquis del 29")
    {
        var producto = new Producto(nombre, "Producto de prueba", 500m, TipoProducto.Simple);
        context.Productos.Add(producto);
        await context.SaveChangesAsync();
        return producto.Id;
    }

    public static async Task SeedVentasAsync(
        TestDbContext context,
        int productoId,
        DateOnly desde,
        DateOnly hasta,
        Func<DateOnly, int> cantidadPorDia)
    {
        var usuario = new Usuario("tester", "hash");
        context.Usuarios.Add(usuario);
        await context.SaveChangesAsync();

        for (DateOnly dia = desde; dia <= hasta; dia = dia.AddDays(1))
        {
            int cantidad = cantidadPorDia(dia);
            if (cantidad <= 0)
                continue;

            var detalle = new DetalleVenta(productoId, cantidad, 500m);
            var venta = Venta.Importar(
                usuario.Id,
                "Efectivo",
                dia.ToDateTime(TimeOnly.MinValue, DateTimeKind.Utc),
                [detalle]);

            context.Ventas.Add(venta);
        }

        await context.SaveChangesAsync();
    }

    public static bool EsFinDeSemana(DateOnly dia) =>
        dia.DayOfWeek is DayOfWeek.Saturday or DayOfWeek.Sunday;

    public static DateOnly ProximoSabado()
    {
        DateOnly hoy = DateOnly.FromDateTime(DateTime.UtcNow);
        int diasHastaSabado = ((int)DayOfWeek.Saturday - (int)hoy.DayOfWeek + 7) % 7;
        if (diasHastaSabado == 0)
            diasHastaSabado = 7;
        return hoy.AddDays(diasHastaSabado);
    }

    public static DateOnly ProximoDiaLaboral()
    {
        DateOnly dia = DateOnly.FromDateTime(DateTime.UtcNow).AddDays(1);
        while (EsFinDeSemana(dia))
            dia = dia.AddDays(1);
        return dia;
    }
}

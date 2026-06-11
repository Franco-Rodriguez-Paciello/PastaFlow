using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging.Abstractions;
using PastaFlow.Application.Commands.Produccion;
using PastaFlow.Domain.Entities;
using PastaFlow.Domain.Exceptions;
using PastaFlow.Domain.Services;
using PastaFlow.Tests.Infrastructure;

namespace PastaFlow.Tests.Application.Commands.Produccion;

/// <summary>
/// Pruebas unitarias para <see cref="RegistrarProduccionCommandHandler"/>.
/// Patrón: Arrange – Act – Assert (AAA).
/// Infraestructura: EF Core InMemory + NullLogger (sin efectos externos).
/// </summary>
public sealed class RegistrarProduccionTests : IDisposable
{
    // ── Dependencias compartidas ──────────────────────────────────────────────
    private readonly TestDbContext _context;
    private readonly RegistrarProduccionCommandHandler _handler;

    // ── Constantes de dominio reutilizadas ───────────────────────────────────
    private const int ProductoId = 1;
    private const int IngredienteHarinaId = 1;
    private const int IngredienteHuevosId = 2;
    private const decimal CantidadHarinaPorUnidad = 200m;   // gramos por unidad
    private const decimal CantidadHuevosPorUnidad = 2m;     // unidades por unidad de producto

    public RegistrarProduccionTests()
    {
        var options = new DbContextOptionsBuilder<TestDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString()) // BD aislada por test
            .Options;

        _context = new TestDbContext(options);
        _handler = new RegistrarProduccionCommandHandler(
            _context,
            new CostoProduccionService(),
            NullLogger<RegistrarProduccionCommandHandler>.Instance);
    }

    // ── Helpers de seeding ───────────────────────────────────────────────────

    /// <summary>
    /// Siembra un producto compuesto con dos insumos en la receta.
    /// El stock de cada insumo se puede configurar individualmente.
    /// </summary>
    private async Task SeedDataAsync(
        decimal stockHarina,
        decimal stockHuevos)
    {
        // Producto compuesto
        var producto = new Producto(
            nombre: "Pasta Casera",
            descripcion: "Pasta fresca artesanal",
            precioVenta: 350m,
            tipoProducto: TipoProducto.Compuesto);

        // Insumos con stock configurable
        var harina = new Ingrediente("Harina 0000", UnidadMedida.Kilogramo, costoActual: 50m);
        harina.AjustarStock(stockHarina);

        var huevos = new Ingrediente("Huevo", UnidadMedida.Unidad, costoActual: 15m);
        huevos.AjustarStock(stockHuevos);

        _context.Productos.Add(producto);
        _context.Ingredientes.AddRange(harina, huevos);
        await _context.SaveChangesAsync(TestContext.Current.CancellationToken);

        // Receta: necesita IDs persistidos
        var receta = new[]
        {
            new RecetaIngrediente(producto.Id, harina.Id,  CantidadHarinaPorUnidad),
            new RecetaIngrediente(producto.Id, huevos.Id, CantidadHuevosPorUnidad),
        };
        _context.RecetaIngredientes.AddRange(receta);
        await _context.SaveChangesAsync(TestContext.Current.CancellationToken);
    }

    // ── ESCENARIO 1: Stock suficiente ────────────────────────────────────────

    [Fact]
    public async Task RegistrarProduccion_CuandoHayStockSuficiente_DebeDescontarStockYRegistrarHistorial()
    {
        // ── Arrange ──────────────────────────────────────────────────────────
        const decimal cantidadProducida = 2m;
        const decimal stockInicialHarina = 600m;  // necesita 400 g, tiene 600 g  → OK
        const decimal stockInicialHuevos = 10m;   // necesita 4 unidades, tiene 10 → OK

        await SeedDataAsync(stockHarina: stockInicialHarina, stockHuevos: stockInicialHuevos);

        var ct = TestContext.Current.CancellationToken;

        var producto   = await _context.Productos.SingleAsync(ct);
        var harina     = await _context.Ingredientes.SingleAsync(i => i.Nombre == "Harina 0000", ct);
        var huevos     = await _context.Ingredientes.SingleAsync(i => i.Nombre == "Huevo", ct);

        var command = new RegistrarProduccionCommand(producto.Id, cantidadProducida);

        // ── Act ───────────────────────────────────────────────────────────────
        int historialId = await _handler.HandleAsync(command, ct);

        // ── Assert ────────────────────────────────────────────────────────────
        // El ID devuelto debe ser válido
        historialId.Should().BeGreaterThan(0);

        // Stock de harina: 600 - (200 * 2) = 200
        decimal stockEsperadoHarina = stockInicialHarina - (CantidadHarinaPorUnidad * cantidadProducida);
        harina.StockActual.Should().Be(stockEsperadoHarina,
            because: "el handler debe descontar exactamente la cantidad requerida por la receta");

        // Stock de huevos: 10 - (2 * 2) = 6
        decimal stockEsperadoHuevos = stockInicialHuevos - (CantidadHuevosPorUnidad * cantidadProducida);
        huevos.StockActual.Should().Be(stockEsperadoHuevos,
            because: "el handler debe descontar exactamente la cantidad requerida por la receta");

        // El stock del producto terminado debe haber aumentado
        producto.StockActual.Should().Be(cantidadProducida,
            because: "el handler debe aumentar el stock del producto terminado");

        // Debe existir exactamente una fila en el historial
        var historial = await _context.HistorialProduccion.ToListAsync(ct);
        historial.Should().ContainSingle(because: "debe registrarse exactamente una entrada en el historial");

        var registro = historial.Single();
        registro.ProductoId.Should().Be(producto.Id);
        registro.CantidadProducida.Should().Be(cantidadProducida);
        registro.CostoTotalReal.Should().Be(20_060m,
            because: "harina (200×2×50) + huevos (2×2×15) = 20.060");
        registro.CostoUnitarioReal.Should().Be(10_030m,
            because: "costo total / cantidad producida = 20.060 / 2");
        registro.FechaDeRegistro.Should().BeCloseTo(DateTime.UtcNow, precision: TimeSpan.FromSeconds(5));
    }

    // ── ESCENARIO 2: Stock insuficiente ──────────────────────────────────────

    [Fact]
    public async Task RegistrarProduccion_CuandoStockEsInsuficiente_DebeLanzarExcepcionYNoModificarNada()
    {
        // ── Arrange ──────────────────────────────────────────────────────────
        const decimal cantidadProducida = 2m;
        const decimal stockInicialHarina = 0m;   // insuficiente para cualquier producción
        const decimal stockInicialHuevos = 0m;   // insuficiente para evitar descuentos parciales según el orden de la receta

        await SeedDataAsync(stockHarina: stockInicialHarina, stockHuevos: stockInicialHuevos);

        var ct = TestContext.Current.CancellationToken;

        var producto = await _context.Productos.SingleAsync(ct);
        var harina   = await _context.Ingredientes.SingleAsync(i => i.Nombre == "Harina 0000", ct);
        var huevos   = await _context.Ingredientes.SingleAsync(i => i.Nombre == "Huevo", ct);

        var command = new RegistrarProduccionCommand(producto.Id, cantidadProducida);

        // ── Act ───────────────────────────────────────────────────────────────
        Func<Task> act = () => _handler.HandleAsync(command, ct);

        // ── Assert ────────────────────────────────────────────────────────────
        // Debe lanzar InvalidDomainOperationException con mensaje descriptivo
        await act.Should()
            .ThrowAsync<InvalidDomainOperationException>(
                because: "la entidad de dominio debe rechazar la producción cuando falta stock")
            .WithMessage("*Stock insuficiente*");

        // El stock de ambos insumos NO debe haber sido modificado
        harina.StockActual.Should().Be(stockInicialHarina,
            because: "la transacción debe revertirse y no persistir descuentos parciales de stock");

        huevos.StockActual.Should().Be(stockInicialHuevos,
            because: "ningún insumo debe alterarse cuando la producción falla");

        // El stock del producto terminado no debe haber aumentado
        producto.StockActual.Should().Be(0m,
            because: "no se produjo nada, el stock del producto no debe cambiar");

        // El historial de producción debe estar vacío
        var historial = await _context.HistorialProduccion.ToListAsync(ct);
        historial.Should().BeEmpty(
            because: "no se debe registrar historial ante una producción fallida");
    }

    // ── IDisposable ──────────────────────────────────────────────────────────
    public void Dispose() => _context.Dispose();
}

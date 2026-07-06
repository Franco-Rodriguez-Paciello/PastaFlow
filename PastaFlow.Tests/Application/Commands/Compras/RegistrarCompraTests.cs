using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging.Abstractions;
using PastaFlow.Application.Commands.Compras;
using PastaFlow.Domain.Entities;
using PastaFlow.Tests.Infrastructure;

namespace PastaFlow.Tests.Application.Commands.Compras;

public sealed class RegistrarCompraTests : IDisposable
{
    private readonly TestDbContext _context;
    private readonly RegistrarCompraCommandHandler _handler;

    public RegistrarCompraTests()
    {
        var options = new DbContextOptionsBuilder<TestDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;

        _context = new TestDbContext(options);
        _handler = new RegistrarCompraCommandHandler(
            _context,
            NullLogger<RegistrarCompraCommandHandler>.Instance);
    }

    [Fact]
    public async Task RegistrarCompra_CuandoEsValida_DebeSumarStockYRegistrarCompra()
    {
        var harina = new Ingrediente("Harina", UnidadMedida.Kilogramo, 50m);
        harina.AjustarStock(10m);
        _context.Ingredientes.Add(harina);
        await _context.SaveChangesAsync(TestContext.Current.CancellationToken);

        var command = new RegistrarCompraCommand(
            ProveedorId: null,
            NumeroFactura: "FC-001",
            Observaciones: null,
            ActualizarCosto: false,
            Lineas: [new CompraLineaInput(harina.Id, 25m, 55m)]);

        int compraId = await _handler.HandleAsync(command, TestContext.Current.CancellationToken);

        compraId.Should().BeGreaterThan(0);
        harina.StockActual.Should().Be(35m);

        var compra = await _context.Compras
            .Include(c => c.Lineas)
            .SingleAsync(TestContext.Current.CancellationToken);

        compra.NumeroFactura.Should().Be("FC-001");
        compra.Total.Should().Be(1375m);
        compra.Lineas.Should().ContainSingle();
    }

    [Fact]
    public async Task RegistrarCompra_CuandoActualizarCosto_DebeActualizarCostoEHistorial()
    {
        var huevos = new Ingrediente("Huevos", UnidadMedida.Unidad, 20m);
        huevos.AjustarStock(5m);
        _context.Ingredientes.Add(huevos);
        await _context.SaveChangesAsync(TestContext.Current.CancellationToken);

        var command = new RegistrarCompraCommand(
            ProveedorId: null,
            NumeroFactura: null,
            Observaciones: null,
            ActualizarCosto: true,
            Lineas: [new CompraLineaInput(huevos.Id, 10m, 28m)]);

        await _handler.HandleAsync(command, TestContext.Current.CancellationToken);

        huevos.CostoActual.Should().Be(28m);

        var historial = await _context.HistorialPreciosIngrediente.ToListAsync(
            TestContext.Current.CancellationToken);
        historial.Should().ContainSingle(h =>
            h.IngredienteId == huevos.Id &&
            h.PrecioCostoAnterior == 20m &&
            h.PrecioCostoNuevo == 28m);
    }

    public void Dispose() => _context.Dispose();
}

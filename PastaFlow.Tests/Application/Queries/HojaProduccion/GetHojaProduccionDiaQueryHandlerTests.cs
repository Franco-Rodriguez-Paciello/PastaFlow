using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using NSubstitute;
using PastaFlow.Application.DTOs;
using PastaFlow.Application.Interfaces;
using PastaFlow.Application.Options;
using PastaFlow.Application.Queries.HojaProduccion;
using PastaFlow.Domain.Entities;
using PastaFlow.Domain.Services;
using PastaFlow.Tests.Infrastructure;

namespace PastaFlow.Tests.Application.Queries.HojaProduccion;

public sealed class GetHojaProduccionDiaQueryHandlerTests : IDisposable
{
    private readonly TestDbContext _context;
    private readonly IPrediccionDemandaService _prediccion;
    private readonly GetHojaProduccionDiaQueryHandler _handler;

    public GetHojaProduccionDiaQueryHandlerTests()
    {
        var options = new DbContextOptionsBuilder<TestDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;

        _context = new TestDbContext(options);
        _prediccion = Substitute.For<IPrediccionDemandaService>();
        _handler = new GetHojaProduccionDiaQueryHandler(
            _prediccion,
            _context,
            new CostoProduccionService(),
            Options.Create(new ComprasInsightOptions()));
    }

    [Fact]
    public async Task HandleAsync_CuandoStockTerminadoEsMenor_DebeCalcularFaltanteProducir()
    {
        var producto = new Producto("Ravioles", "Frescos", 800m, TipoProducto.Simple);
        producto.AjustarStock(3m);
        _context.Productos.Add(producto);
        await _context.SaveChangesAsync(TestContext.Current.CancellationToken);

        DateOnly fecha = DateOnly.FromDateTime(DateTime.UtcNow).AddDays(1);
        var clima = new ClimaPronosticoDto(false, null, null, false, "N/A");

        _prediccion.CalcularAsync(fecha, Arg.Any<CancellationToken>())
            .Returns(new PrediccionDemandaDto(
                fecha,
                false,
                false,
                clima,
                new RangoAnalisisDemandaDto(fecha, fecha, 1, 1),
                [
                    new PrediccionProductoDto(
                        producto.Id,
                        producto.Nombre,
                        10m,
                        10m,
                        1m,
                        1m,
                        10m,
                        [])
                ],
                10m,
                null));

        HojaProduccionDiaDto hoja = await _handler.HandleAsync(
            new GetHojaProduccionDiaQuery(fecha),
            TestContext.Current.CancellationToken);

        var linea = hoja.Lineas.Single();
        linea.CantidadPredicha.Should().Be(10m);
        linea.StockTerminadoActual.Should().Be(3m);
        linea.CantidadFaltaProducir.Should().Be(7m);
        hoja.TotalFaltaProducir.Should().Be(7m);
        hoja.LineasConFalta.Should().Be(1);
    }

    [Fact]
    public async Task HandleAsync_CuandoFaltanInsumos_DebeAgregarInsumosConFaltante()
    {
        var producto = new Producto("Sorrentinos", "Frescos", 900m, TipoProducto.Compuesto);
        var harina = new Ingrediente("Harina", UnidadMedida.Kilogramo, 100m);
        harina.AjustarStock(300m);

        _context.Productos.Add(producto);
        _context.Ingredientes.Add(harina);
        await _context.SaveChangesAsync(TestContext.Current.CancellationToken);

        _context.RecetaIngredientes.Add(new RecetaIngrediente(producto.Id, harina.Id, 100m));
        await _context.SaveChangesAsync(TestContext.Current.CancellationToken);

        DateOnly fecha = DateOnly.FromDateTime(DateTime.UtcNow).AddDays(1);
        var clima = new ClimaPronosticoDto(false, null, null, false, "N/A");

        _prediccion.CalcularAsync(fecha, Arg.Any<CancellationToken>())
            .Returns(new PrediccionDemandaDto(
                fecha,
                false,
                false,
                clima,
                new RangoAnalisisDemandaDto(fecha, fecha, 1, 1),
                [
                    new PrediccionProductoDto(
                        producto.Id,
                        producto.Nombre,
                        10m,
                        10m,
                        1m,
                        1m,
                        10m,
                        [])
                ],
                10m,
                null));

        HojaProduccionDiaDto hoja = await _handler.HandleAsync(
            new GetHojaProduccionDiaQuery(fecha),
            TestContext.Current.CancellationToken);

        var insumo = hoja.InsumosAgregados.Single();
        insumo.IngredienteId.Should().Be(harina.Id);
        insumo.CantidadRequeridaTotal.Should().Be(1000m);
        insumo.Faltante.Should().Be(700m);
        insumo.Suficiente.Should().BeFalse();
        hoja.PuedeProducirTodo.Should().BeFalse();
    }

    public void Dispose() => _context.Dispose();
}

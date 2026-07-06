using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using NSubstitute;
using PastaFlow.Application.DTOs;
using PastaFlow.Application.Interfaces;
using PastaFlow.Application.Options;
using PastaFlow.Application.Queries.Compras;
using PastaFlow.Application.Queries.HojaProduccion;
using PastaFlow.Domain.Entities;
using PastaFlow.Domain.Services;
using PastaFlow.Tests.Infrastructure;

namespace PastaFlow.Tests.Application.Queries.Compras;

public sealed class GetSugerenciasCompraQueryHandlerTests : IDisposable
{
    private readonly TestDbContext _context;
    private readonly IPrediccionDemandaService _prediccion;
    private readonly GetSugerenciasCompraQueryHandler _handler;

    public GetSugerenciasCompraQueryHandlerTests()
    {
        var options = new DbContextOptionsBuilder<TestDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;

        _context = new TestDbContext(options);
        _prediccion = Substitute.For<IPrediccionDemandaService>();

        var hojaHandler = new GetHojaProduccionDiaQueryHandler(
            _prediccion,
            _context,
            new CostoProduccionService(),
            Options.Create(new ComprasInsightOptions()));

        _handler = new GetSugerenciasCompraQueryHandler(_context, hojaHandler);
    }

    [Fact]
    public async Task HandleAsync_CuandoInsumoEstaEnStockCritico_DebeSugerirReposicion()
    {
        var harina = new Ingrediente("Harina", UnidadMedida.Kilogramo, 80m);
        harina.AjustarStock(2m);
        harina.SetUmbralCritico(10m);
        _context.Ingredientes.Add(harina);
        await _context.SaveChangesAsync(TestContext.Current.CancellationToken);

        DateOnly fecha = DateOnly.FromDateTime(DateTime.UtcNow).AddDays(1);
        ConfigurarPrediccionVacia(fecha);

        IReadOnlyCollection<SugerenciaCompraDto> sugerencias = await _handler.HandleAsync(
            new GetSugerenciasCompraQuery(fecha),
            TestContext.Current.CancellationToken);

        var sugerencia = sugerencias.Single();
        sugerencia.IngredienteId.Should().Be(harina.Id);
        sugerencia.Motivo.Should().Be("StockCritico");
        sugerencia.CantidadSugerida.Should().BeGreaterThan(0m);
    }

    [Fact]
    public async Task HandleAsync_CuandoHojaTieneFaltantes_DebePriorizarFaltanteProduccion()
    {
        var producto = new Producto("Sorrentinos", "Frescos", 900m, TipoProducto.Compuesto);
        var huevos = new Ingrediente("Huevos", UnidadMedida.Unidad, 25m);
        huevos.AjustarStock(5m);
        huevos.SetUmbralCritico(2m);

        _context.Productos.Add(producto);
        _context.Ingredientes.Add(huevos);
        await _context.SaveChangesAsync(TestContext.Current.CancellationToken);

        _context.RecetaIngredientes.Add(new RecetaIngrediente(producto.Id, huevos.Id, 2m));
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

        IReadOnlyCollection<SugerenciaCompraDto> sugerencias = await _handler.HandleAsync(
            new GetSugerenciasCompraQuery(fecha),
            TestContext.Current.CancellationToken);

        var sugerencia = sugerencias.Single(s => s.IngredienteId == huevos.Id);
        sugerencia.Motivo.Should().Be("FaltanteProduccion");
        sugerencia.CantidadSugerida.Should().Be(15m);
    }

    private void ConfigurarPrediccionVacia(DateOnly fecha)
    {
        var clima = new ClimaPronosticoDto(false, null, null, false, "N/A");
        _prediccion.CalcularAsync(fecha, Arg.Any<CancellationToken>())
            .Returns(new PrediccionDemandaDto(
                fecha,
                false,
                false,
                clima,
                new RangoAnalisisDemandaDto(fecha, fecha, 0, 0),
                [],
                0m,
                null));
    }

    public void Dispose() => _context.Dispose();
}

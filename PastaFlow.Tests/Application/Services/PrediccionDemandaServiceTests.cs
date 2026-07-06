using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using NSubstitute;
using PastaFlow.Application.DTOs;
using PastaFlow.Application.Interfaces;
using PastaFlow.Application.Services;
using PastaFlow.Tests.Infrastructure;

namespace PastaFlow.Tests.Application.Services;

public sealed class PrediccionDemandaServiceTests : IDisposable
{
    private readonly TestDbContext _context;
    private readonly IClimaProvider _clima;
    private readonly PrediccionDemandaService _service;

    public PrediccionDemandaServiceTests()
    {
        var options = new DbContextOptionsBuilder<TestDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;

        _context = new TestDbContext(options);
        _clima = Substitute.For<IClimaProvider>();
        _clima.EsFrioOLluviosoHistorico(Arg.Any<DateOnly>()).Returns(false);
        _clima.ObtenerPronosticoAsync(Arg.Any<DateOnly>(), Arg.Any<CancellationToken>())
            .Returns(new PronosticoDiaResult(false, null, null, false, "Sin pronóstico"));

        _service = new PrediccionDemandaService(_context, _clima);
    }

    [Fact]
    public async Task CalcularAsync_FinDeSemana_DebeUsarPromedioMayorQueDiaDeSemana()
    {
        int productoId = await VentasTestHelper.SeedProductoAsync(_context);
        DateOnly hasta = DateOnly.FromDateTime(DateTime.UtcNow);
        DateOnly desde = hasta.AddMonths(-3);

        await VentasTestHelper.SeedVentasAsync(
            _context,
            productoId,
            desde,
            hasta,
            dia => VentasTestHelper.EsFinDeSemana(dia) ? 24 : 8);

        var ct = TestContext.Current.CancellationToken;
        DateOnly sabado = VentasTestHelper.ProximoSabado();
        DateOnly laboral = VentasTestHelper.ProximoDiaLaboral();

        PrediccionDemandaDto finde = await _service.CalcularAsync(sabado, ct);
        PrediccionDemandaDto semana = await _service.CalcularAsync(laboral, ct);

        decimal predFinde = finde.Productos.Single(p => p.ProductoId == productoId).PrediccionUnidades;
        decimal predSemana = semana.Productos.Single(p => p.ProductoId == productoId).PrediccionUnidades;

        predFinde.Should().BeGreaterThan(predSemana,
            because: "el modelo debe distinguir demanda de fin de semana vs día de semana");
        predFinde.Should().BeGreaterThan(10m);
        predSemana.Should().BeLessThan(predFinde);
        finde.EsFinDeSemana.Should().BeTrue();
        semana.EsFinDeSemana.Should().BeFalse();
    }

    [Fact]
    public async Task CalcularAsync_Dia29_DebeMarcarEsDia29YElevarPrediccion()
    {
        int productoId = await VentasTestHelper.SeedProductoAsync(_context, "Ñoquis");
        DateOnly hasta = DateOnly.FromDateTime(DateTime.UtcNow);
        DateOnly desde = hasta.AddMonths(-3);

        await VentasTestHelper.SeedVentasAsync(
            _context,
            productoId,
            desde,
            hasta,
            dia => dia.Day == 29 ? 40 : 10);

        var ct = TestContext.Current.CancellationToken;
        DateOnly dia29 = new(hasta.Year, hasta.Month, 29);
        if (dia29 > hasta)
            dia29 = dia29.AddMonths(-1);

        PrediccionDemandaDto resultado = await _service.CalcularAsync(dia29, ct);
        decimal pred29 = resultado.Productos.Single(p => p.ProductoId == productoId).PrediccionUnidades;

        resultado.EsDia29.Should().BeTrue();
        pred29.Should().BeGreaterThan(15m,
            because: "las ventas del día 29 deben elevar la predicción respecto al promedio base");
    }

    public void Dispose() => _context.Dispose();
}

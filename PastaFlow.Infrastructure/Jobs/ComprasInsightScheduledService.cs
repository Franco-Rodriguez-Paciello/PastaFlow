using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using PastaFlow.Application.Commands.Dashboard;
using PastaFlow.Application.Interfaces;
using PastaFlow.Application.Options;
using PastaFlow.Domain.Entities;

namespace PastaFlow.Infrastructure.Jobs;

/// <summary>
/// Genera el insight de compras automáticamente antes del inicio operativo del día.
/// Revisa cada minuto si corresponde ejecutar (ej. 06:30 si HoraInicioDia es 07:00).
/// </summary>
public sealed class ComprasInsightScheduledService(
    IServiceProvider serviceProvider,
    IOptions<ComprasInsightOptions> options,
    ILogger<ComprasInsightScheduledService> logger) : BackgroundService
{
    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        ComprasInsightOptions config = options.Value;

        if (!config.JobNocturnoHabilitado)
        {
            logger.LogInformation("Job de ComprasInsight deshabilitado (ComprasInsight:JobNocturnoHabilitado = false)");
            return;
        }

        TimeZoneInfo zona = ResolveTimeZone(config.ZonaHoraria);
        DateTime ahoraLocal = TimeZoneInfo.ConvertTimeFromUtc(DateTime.UtcNow, zona);
        DateTime proximaCorrida = CalcularProximaCorrida(ahoraLocal, config);
        TimeSpan horaEjecucion = CalcularHoraEjecucion(config);

        logger.LogInformation(
            "Job de ComprasInsight activo. Zona: {Zona}. Ventana de generación: {HoraEjecucion:hh\\:mm} → {HoraInicio:hh\\:mm} " +
            "(reintenta cada minuto si falla). Próximo inicio de ventana: {ProximaCorrida:yyyy-MM-dd HH:mm}",
            config.ZonaHoraria,
            horaEjecucion,
            config.HoraInicioDia,
            proximaCorrida);

        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                await TryRunScheduledGenerationAsync(stoppingToken);
            }
            catch (Exception ex) when (ex is not OperationCanceledException)
            {
                logger.LogWarning(
                    ex,
                    "Generación automática de ComprasInsight falló; se reintentará en el próximo minuto si sigue dentro de la ventana programada");
            }

            await Task.Delay(TimeSpan.FromMinutes(1), stoppingToken);
        }
    }

    private async Task TryRunScheduledGenerationAsync(CancellationToken cancellationToken)
    {
        ComprasInsightOptions config = options.Value;
        if (!config.JobNocturnoHabilitado)
            return;

        TimeZoneInfo zona = ResolveTimeZone(config.ZonaHoraria);
        DateTime ahoraLocal = TimeZoneInfo.ConvertTimeFromUtc(DateTime.UtcNow, zona);
        TimeSpan horaEjecucion = CalcularHoraEjecucion(config);

        if (!IsWithinRetryWindow(ahoraLocal, horaEjecucion, config.HoraInicioDia))
            return;

        string diaOperativo = ResolveDiaOperativo(ahoraLocal, config.HoraInicioDia).ToString("yyyy-MM-dd");

        using IServiceScope scope = serviceProvider.CreateScope();
        IPastaFlowDbContext db = scope.ServiceProvider.GetRequiredService<IPastaFlowDbContext>();

        bool yaGenerado = await db.InformesComprasInsight
            .AsNoTracking()
            .AnyAsync(
                i => i.Origen == OrigenInformeCompras.Automatico && i.DiaOperativo == diaOperativo,
                cancellationToken);

        if (yaGenerado)
            return;

        logger.LogInformation(
            "Generando insight automático de compras para el día operativo {DiaOperativo}…",
            diaOperativo);

        GenerateComprasInsightCommandHandler handler =
            scope.ServiceProvider.GetRequiredService<GenerateComprasInsightCommandHandler>();

        await handler.HandleAsync(
            new GenerateComprasInsightCommand(OrigenInformeCompras.Automatico),
            cancellationToken);

        logger.LogInformation(
            "Insight automático de compras generado correctamente para {DiaOperativo}",
            diaOperativo);
    }

    private static TimeSpan CalcularHoraEjecucion(ComprasInsightOptions config)
    {
        TimeSpan horaObjetivo = config.HoraInicioDia - TimeSpan.FromMinutes(config.MinutosAntesDelInicioOperativo);
        return horaObjetivo < TimeSpan.Zero ? horaObjetivo + TimeSpan.FromDays(1) : horaObjetivo;
    }

    private static DateTime CalcularProximaCorrida(DateTime ahoraLocal, ComprasInsightOptions config)
    {
        TimeSpan horaEjecucion = CalcularHoraEjecucion(config);
        DateTime candidata = ahoraLocal.Date + horaEjecucion;
        if (ahoraLocal >= candidata.AddMinutes(1))
            candidata = candidata.AddDays(1);
        return candidata;
    }

    private static bool IsWithinRetryWindow(
        DateTime ahoraLocal,
        TimeSpan horaEjecucion,
        TimeSpan horaInicioDia)
    {
        DateTime ventanaInicio = ahoraLocal.Date + horaEjecucion;
        DateTime ventanaFin = ahoraLocal.Date + horaInicioDia;

        if (ventanaFin <= ventanaInicio)
            ventanaFin = ventanaFin.AddDays(1);

        return ahoraLocal >= ventanaInicio && ahoraLocal < ventanaFin;
    }

    private static DateOnly ResolveDiaOperativo(DateTime consultaLocal, TimeSpan horaInicioDia)
    {
        DateTime inicioHoy = consultaLocal.Date + horaInicioDia;
        DateTime referencia = consultaLocal < inicioHoy
            ? consultaLocal.AddDays(-1)
            : consultaLocal;
        return DateOnly.FromDateTime(referencia);
    }

    private static TimeZoneInfo ResolveTimeZone(string zonaHorariaId)
    {
        try
        {
            return TimeZoneInfo.FindSystemTimeZoneById(zonaHorariaId);
        }
        catch (TimeZoneNotFoundException)
        {
            return TimeZoneInfo.FindSystemTimeZoneById("Argentina Standard Time");
        }
        catch (InvalidTimeZoneException)
        {
            return TimeZoneInfo.FindSystemTimeZoneById("Argentina Standard Time");
        }
    }
}

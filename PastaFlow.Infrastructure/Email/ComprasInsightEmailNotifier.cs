using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using PastaFlow.Application.DTOs;
using PastaFlow.Application.Interfaces;
using PastaFlow.Application.Options;
using PastaFlow.Domain.Entities;

namespace PastaFlow.Infrastructure.Email;

public sealed class ComprasInsightEmailNotifier(
    IEmailSender emailSender,
    IOptions<EmailOptions> emailOptions,
    IOptions<ComprasInsightOptions> insightOptions,
    ILogger<ComprasInsightEmailNotifier> logger) : IComprasInsightEmailNotifier
{
    public async Task<ComprasInsightEmailResult> NotifyIfConfiguredAsync(
        ComprasInsightDto informe,
        OrigenInformeCompras origen,
        bool enviarPorEmail,
        CancellationToken cancellationToken = default)
    {
        EmailOptions email = emailOptions.Value;
        ComprasInsightOptions insight = insightOptions.Value;

        bool debeEnviar = origen switch
        {
            OrigenInformeCompras.Automatico => insight.EnviarEmailEnGeneracionAutomatica,
            OrigenInformeCompras.Manual => enviarPorEmail,
            _ => false
        };

        if (!debeEnviar)
        {
            logger.LogDebug(
                "Envío de insight por correo omitido (origen {Origen}, solicitud manual={SolicitudManual})",
                origen,
                enviarPorEmail);
            return new ComprasInsightEmailResult(ComprasInsightEmailEstado.NoSolicitado);
        }

        if (!email.Habilitado)
        {
            logger.LogWarning(
                "Se solicitó enviar el insight por correo pero Email:Habilitado es false (día {DiaOperativo})",
                informe.DiaOperativo);
            return new ComprasInsightEmailResult(
                ComprasInsightEmailEstado.Deshabilitado,
                "El envío por correo no está habilitado en la configuración del servidor.");
        }

        string[] destinatarios = email.DestinatariosInsight
            .Where(d => !string.IsNullOrWhiteSpace(d))
            .Select(d => d.Trim())
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .ToArray();

        if (destinatarios.Length == 0)
        {
            logger.LogWarning(
                "Email habilitado pero Email:DestinatariosInsight está vacío; no se envió el insight del día {DiaOperativo}",
                informe.DiaOperativo);
            return new ComprasInsightEmailResult(
                ComprasInsightEmailEstado.SinDestinatarios,
                "No hay destinatarios configurados en Email:DestinatariosInsight.");
        }

        string origenEtiqueta = origen == OrigenInformeCompras.Automatico ? "Automático" : "Manual";
        string asunto = $"PastaFlow | Insight de Compras – {informe.DiaOperativo}";
        string cuerpo = BuildPlainTextBody(informe, origenEtiqueta);

        try
        {
            await emailSender.SendAsync(
                new EmailMessage(destinatarios, asunto, cuerpo),
                cancellationToken);

            string destinos = string.Join(", ", destinatarios);
            logger.LogInformation(
                "Insight de compras ({Origen}) enviado por correo a [{Destinatarios}] para el día operativo {DiaOperativo}",
                origenEtiqueta,
                destinos,
                informe.DiaOperativo);

            return new ComprasInsightEmailResult(
                ComprasInsightEmailEstado.Enviado,
                $"Correo enviado a: {destinos}");
        }
        catch (Exception ex) when (ex is not OperationCanceledException)
        {
            logger.LogWarning(
                ex,
                "No se pudo enviar el insight de compras por correo (día {DiaOperativo}). El informe quedó guardado en la base de datos.",
                informe.DiaOperativo);

            return new ComprasInsightEmailResult(
                ComprasInsightEmailEstado.Error,
                ex.Message);
        }
    }

    private static string BuildPlainTextBody(ComprasInsightDto informe, string origenEtiqueta)
    {
        string generadoLocal = informe.GeneradoEnUtc.ToLocalTime().ToString("dd/MM/yyyy HH:mm");

        return $"""
            PastaFlow – Insight de Compras
            ==============================

            Día operativo: {informe.DiaOperativo}
            Generado: {generadoLocal}
            Origen: {origenEtiqueta}

            ---

            {informe.Reporte}

            ---

            Este mensaje fue generado automáticamente por PastaFlow.
            Podés ver el historial completo en el panel de Dashboard.
            """;
    }
}

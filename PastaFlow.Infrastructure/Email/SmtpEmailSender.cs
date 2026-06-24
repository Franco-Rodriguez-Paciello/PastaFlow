using MailKit.Net.Smtp;
using MailKit.Security;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using MimeKit;
using PastaFlow.Application.Interfaces;
using PastaFlow.Application.Options;

namespace PastaFlow.Infrastructure.Email;

public sealed class SmtpEmailSender(
    IOptions<EmailOptions> options,
    ILogger<SmtpEmailSender> logger) : IEmailSender
{
    public async Task SendAsync(EmailMessage message, CancellationToken cancellationToken = default)
    {
        EmailOptions config = options.Value;

        if (string.IsNullOrWhiteSpace(config.SmtpHost))
            throw new InvalidOperationException("Email:SmtpHost no está configurado.");

        if (string.IsNullOrWhiteSpace(config.FromAddress))
            throw new InvalidOperationException("Email:FromAddress no está configurado.");

        if (message.To.Count == 0)
            throw new InvalidOperationException("El mensaje no tiene destinatarios.");

        string password = ResolvePassword(config);

        if (!string.IsNullOrWhiteSpace(config.Usuario) && string.IsNullOrWhiteSpace(password))
            throw new InvalidOperationException(
                "Email:Password no está configurado. Para Gmail usá una contraseña de aplicación " +
                "(no la contraseña de la cuenta) vía User Secrets: Email:Password o variable Email__Password.");

        var mime = new MimeMessage();
        mime.From.Add(new MailboxAddress(config.FromName, config.FromAddress.Trim()));

        foreach (string destinatario in message.To)
            mime.To.Add(MailboxAddress.Parse(destinatario.Trim()));

        mime.Subject = message.Subject;
        mime.Body = new TextPart("plain") { Text = message.PlainTextBody };

        using var client = new SmtpClient();
        var socketOptions = config.UseStartTls
            ? SecureSocketOptions.StartTls
            : SecureSocketOptions.Auto;

        await client.ConnectAsync(config.SmtpHost, config.SmtpPort, socketOptions, cancellationToken);

        if (!string.IsNullOrWhiteSpace(config.Usuario))
            await client.AuthenticateAsync(config.Usuario.Trim(), password, cancellationToken);

        await client.SendAsync(mime, cancellationToken);
        await client.DisconnectAsync(quit: true, cancellationToken);

        logger.LogInformation(
            "Correo enviado a {Destinatarios} — asunto: {Asunto}",
            string.Join(", ", message.To),
            message.Subject);
    }

    private static string ResolvePassword(EmailOptions config) =>
        Environment.GetEnvironmentVariable("Email__Password")
        ?? config.Password
        ?? string.Empty;
}

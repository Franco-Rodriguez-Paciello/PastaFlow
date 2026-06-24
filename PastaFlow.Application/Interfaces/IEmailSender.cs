namespace PastaFlow.Application.Interfaces;

public sealed record EmailMessage(
    IReadOnlyCollection<string> To,
    string Subject,
    string PlainTextBody);

public interface IEmailSender
{
    Task SendAsync(EmailMessage message, CancellationToken cancellationToken = default);
}

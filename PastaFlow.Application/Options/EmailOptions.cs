namespace PastaFlow.Application.Options;

public sealed class EmailOptions
{
    public const string SectionName = "Email";

    /// <summary>Maestro: sin esto no se envía ningún correo aunque haya destinatarios.</summary>
    public bool Habilitado { get; init; }

    public string SmtpHost { get; init; } = string.Empty;

    public int SmtpPort { get; init; } = 587;

    public bool UseStartTls { get; init; } = true;

    public string? Usuario { get; init; }

    /// <summary>Preferir variable de entorno Email__Password en producción.</summary>
    public string? Password { get; init; }

    public string FromAddress { get; init; } = string.Empty;

    public string FromName { get; init; } = "PastaFlow";

    /// <summary>Destinatarios del insight de compras (admins de planta).</summary>
    public string[] DestinatariosInsight { get; init; } = [];
}

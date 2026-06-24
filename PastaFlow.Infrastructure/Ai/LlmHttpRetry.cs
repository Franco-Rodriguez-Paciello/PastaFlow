namespace PastaFlow.Infrastructure.Ai;

internal static class LlmHttpRetry
{
    private const int MaxAttempts = 3;

    public static int MaxAttemptsCount => MaxAttempts;

    public static bool IsTransient(int statusCode) =>
        statusCode is 408 or 429 or 500 or 502 or 503 or 504;

    public static TimeSpan GetDelayBeforeAttempt(int attempt) =>
        TimeSpan.FromSeconds(Math.Pow(2, attempt));
}

using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using PastaFlow.Application.Interfaces;
using PastaFlow.Application.Options;

namespace PastaFlow.Infrastructure.Ai;

public static class LlmServiceCollectionExtensions
{
    public static IServiceCollection AddLlmCompletionService(
        this IServiceCollection services,
        IConfiguration configuration)
    {
        services.Configure<LlmOptions>(configuration.GetSection(LlmOptions.SectionName));
        services.Configure<GeminiOptions>(configuration.GetSection(GeminiOptions.SectionName));
        services.Configure<GroqOptions>(configuration.GetSection(GroqOptions.SectionName));

        string provider = configuration.GetSection(LlmOptions.SectionName).GetValue<string>("Provider") ?? "Groq";

        if (provider.Equals("Gemini", StringComparison.OrdinalIgnoreCase))
        {
            services.AddHttpClient<ILlmCompletionService, GeminiCompletionService>(client =>
            {
                client.BaseAddress = new Uri("https://generativelanguage.googleapis.com/");
                client.Timeout = TimeSpan.FromSeconds(90);
            });
        }
        else
        {
            services.AddHttpClient<ILlmCompletionService, GroqCompletionService>(client =>
            {
                client.BaseAddress = new Uri("https://api.groq.com/");
                client.Timeout = TimeSpan.FromSeconds(90);
            });
        }

        return services;
    }
}

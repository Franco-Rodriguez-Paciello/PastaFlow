using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using PastaFlow.Application.Interfaces;

namespace PastaFlow.Infrastructure.Clima;

public static class ClimaServiceCollectionExtensions
{
    public static IServiceCollection AddClimaProvider(
        this IServiceCollection services,
        IConfiguration configuration)
    {
        services.Configure<ClimaOptions>(configuration.GetSection(ClimaOptions.SectionName));

        services.AddHttpClient<IClimaProvider, OpenMeteoClimaProvider>(client =>
        {
            client.BaseAddress = new Uri("https://api.open-meteo.com/");
            client.Timeout = TimeSpan.FromSeconds(15);
        });

        return services;
    }
}

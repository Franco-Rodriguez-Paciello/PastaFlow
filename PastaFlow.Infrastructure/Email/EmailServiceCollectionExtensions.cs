using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using PastaFlow.Application.Interfaces;
using PastaFlow.Application.Options;

namespace PastaFlow.Infrastructure.Email;

public static class EmailServiceCollectionExtensions
{
    public static IServiceCollection AddEmailServices(
        this IServiceCollection services,
        IConfiguration configuration)
    {
        services.Configure<EmailOptions>(configuration.GetSection(EmailOptions.SectionName));
        services.AddScoped<IEmailSender, SmtpEmailSender>();
        services.AddScoped<IComprasInsightEmailNotifier, ComprasInsightEmailNotifier>();
        return services;
    }
}

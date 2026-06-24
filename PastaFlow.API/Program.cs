using FluentValidation;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Serilog;
using System.Security.Claims;
using PastaFlow.API.Endpoints;
using PastaFlow.API.Middleware;
using PastaFlow.Application.Commands.Ingredientes;
using PastaFlow.Application.Commands.Produccion;
using PastaFlow.Application.Commands.Productos;
using PastaFlow.Application.Commands.Ventas;
using PastaFlow.Application.Interfaces;
using PastaFlow.Application.Options;
using PastaFlow.Application.Queries.Dashboard;
using PastaFlow.Application.Services;
using PastaFlow.Infrastructure.Ai;
using PastaFlow.Application.Queries.Ingredientes;
using PastaFlow.Application.Queries.Produccion;
using PastaFlow.Application.Queries.Productos;
using PastaFlow.Domain;
using PastaFlow.Domain.Services;
using PastaFlow.Infrastructure.Auth;
using PastaFlow.Infrastructure.Persistence;
using System.Text;
using System.Text.Json.Serialization;

var builder = WebApplication.CreateBuilder(args);

Log.Logger = new LoggerConfiguration()
    .ReadFrom.Configuration(builder.Configuration)
    .CreateLogger();

builder.Host.UseSerilog();

try
{
    Log.Information("Iniciando PastaFlow.API");

    // .NET 10 built-in OpenAPI support (replaces Swashbuckle)
    builder.Services.AddOpenApi();

    // Serializar enums como strings en toda la API
    builder.Services.ConfigureHttpJsonOptions(options =>
        options.SerializerOptions.Converters.Add(new JsonStringEnumConverter()));

    builder.Services.AddExceptionHandler<CustomExceptionHandler>();
    builder.Services.AddProblemDetails();

    // JWT Authentication
    // ADVERTENCIA PRODUCCIÓN: nunca depender del SecretKey embebido en appsettings.json.
    // Prioridad: variable de entorno Jwt__SecretKey → User Secrets / IConfiguration → fallback appsettings (solo dev local).
    var jwtSection = builder.Configuration.GetSection("Jwt");
    var secretKey =
        Environment.GetEnvironmentVariable("Jwt__SecretKey")
        ?? jwtSection["SecretKey"]
        ?? throw new InvalidOperationException(
            "JWT SecretKey no está configurado. Definí Jwt__SecretKey como variable de entorno o User Secret.");

    builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
        .AddJwtBearer(options =>
        {
            options.TokenValidationParameters = new TokenValidationParameters
            {
                ValidateIssuer = true,
                ValidateAudience = true,
                ValidateLifetime = true,
                ValidateIssuerSigningKey = true,
                ValidIssuer = jwtSection["Issuer"],
                ValidAudience = jwtSection["Audience"],
                IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secretKey)),
                ClockSkew = TimeSpan.Zero,
                // Asegura que [Authorize(Roles="...")] y RequireRole() lean el claim correcto del JWT
                RoleClaimType = ClaimTypes.Role
            };
        });

    builder.Services.AddAuthorization(options =>
    {
        options.AddPolicy("AdminOnly",       policy => policy.RequireRole(Roles.Admin));
        options.AddPolicy("AdminOrOperario", policy => policy.RequireRole(Roles.Admin, Roles.Operario));
    });

    builder.Services.AddScoped<IJwtTokenGenerator, JwtTokenGenerator>();

    builder.Services.Configure<ComprasInsightOptions>(
        builder.Configuration.GetSection(ComprasInsightOptions.SectionName));
    builder.Services.AddLlmCompletionService(builder.Configuration);
    builder.Services.AddScoped<IComprasInsightContextBuilder, ComprasInsightContextBuilder>();

    // Registra automáticamente todos los validadores del ensamblado Application
    builder.Services.AddValidatorsFromAssemblyContaining<RegistrarProduccionCommandValidator>();

    // Persistencia
    builder.Services.AddDbContext<PastaFlowDbContext>(options =>
        options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection")));

    builder.Services.AddScoped<IPastaFlowDbContext, PastaFlowDbContext>();

    // Servicios de dominio
    builder.Services.AddScoped<ICostoProduccionService, CostoProduccionService>();

    // Handlers CQRS
    builder.Services.AddScoped<RegistrarIngredienteCommandHandler>();
    builder.Services.AddScoped<ActualizarCostoIngredienteCommandHandler>();
    builder.Services.AddScoped<ActualizarStockIngredienteCommandHandler>();
    builder.Services.AddScoped<ActualizarUmbralIngredienteCommandHandler>();
    builder.Services.AddScoped<RegistrarAjusteManualCommandHandler>();
    builder.Services.AddScoped<GetIngredientesQueryHandler>();
    builder.Services.AddScoped<GetHistorialAjustesQueryHandler>();
    builder.Services.AddScoped<RegistrarProductoCommandHandler>();
    builder.Services.AddScoped<AsignarRecetaCommandHandler>();
    builder.Services.AddScoped<GuardarRecetaCommandHandler>();
    builder.Services.AddScoped<GetProductosQueryHandler>();
    builder.Services.AddScoped<GetProductProfitabilityQueryHandler>();
    builder.Services.AddScoped<GetRecetaByProductoQueryHandler>();
    builder.Services.AddScoped<CrearOrdenProduccionCommandHandler>();
    builder.Services.AddScoped<RegistrarProduccionCommandHandler>();
    builder.Services.AddScoped<GetHistorialProduccionQueryHandler>();
    builder.Services.AddScoped<GetDashboardStatsQueryHandler>();
    builder.Services.AddScoped<GetFinancialDashboardQueryHandler>();
    builder.Services.AddScoped<GenerateComprasInsightQueryHandler>();
    builder.Services.AddScoped<RegistrarVentaCommandHandler>();

    var app = builder.Build();

    if (app.Environment.IsDevelopment())
    {
        using (var scope = app.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<PastaFlowDbContext>();
            await db.Database.MigrateAsync();
        }

        app.MapOpenApi();
    }

    app.UseExceptionHandler();
    app.UseHttpsRedirection();

    app.UseAuthentication();
    app.UseAuthorization();

    app.MapAuthEndpoints();
    app.MapIngredienteEndpoints();
    app.MapProductoEndpoints();
    app.MapProduccionEndpoints();
    app.MapVentasEndpoints();
    app.MapDashboardEndpoints();

    app.Run();
}
catch (Exception ex)
{
    Log.Fatal(ex, "PastaFlow.API terminó inesperadamente");
    throw;
}
finally
{
    await Log.CloseAndFlushAsync();
}

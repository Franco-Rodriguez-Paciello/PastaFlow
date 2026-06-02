using FluentValidation;
using System.Text.Json.Serialization;
using Microsoft.EntityFrameworkCore;
using PastaFlow.API.Endpoints;
using PastaFlow.API.Middleware;
using PastaFlow.Application.Commands.Ingredientes;
using PastaFlow.Application.Commands.Produccion;
using PastaFlow.Application.Commands.Productos;
using PastaFlow.Application.Interfaces;
using PastaFlow.Application.Queries.Dashboard;
using PastaFlow.Application.Queries.Ingredientes;
using PastaFlow.Application.Queries.Produccion;
using PastaFlow.Application.Queries.Productos;
using PastaFlow.Infrastructure.Persistence;

var builder = WebApplication.CreateBuilder(args);

// .NET 10 built-in OpenAPI support (replaces Swashbuckle)
builder.Services.AddOpenApi();

// Serializar enums como strings en toda la API
builder.Services.ConfigureHttpJsonOptions(options =>
    options.SerializerOptions.Converters.Add(new JsonStringEnumConverter()));

builder.Services.AddExceptionHandler<CustomExceptionHandler>();
builder.Services.AddProblemDetails();

// Registra automáticamente todos los validadores del ensamblado Application
builder.Services.AddValidatorsFromAssemblyContaining<RegistrarProduccionCommandValidator>();

// Persistencia
builder.Services.AddDbContext<PastaFlowDbContext>(options =>
    options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection")));

builder.Services.AddScoped<IPastaFlowDbContext, PastaFlowDbContext>();

// Handlers CQRS
builder.Services.AddScoped<RegistrarIngredienteCommandHandler>();
builder.Services.AddScoped<ActualizarCostoIngredienteCommandHandler>();
builder.Services.AddScoped<RegistrarAjusteManualCommandHandler>();
builder.Services.AddScoped<GetIngredientesQueryHandler>();
builder.Services.AddScoped<GetHistorialAjustesQueryHandler>();
builder.Services.AddScoped<RegistrarProductoCommandHandler>();
builder.Services.AddScoped<AsignarRecetaCommandHandler>();
builder.Services.AddScoped<GuardarRecetaCommandHandler>();
builder.Services.AddScoped<GetProductosQueryHandler>();
builder.Services.AddScoped<GetProductProfitabilityQueryHandler>();
builder.Services.AddScoped<GetRecetaByProductoQueryHandler>();
builder.Services.AddScoped<RegistrarProduccionCommandHandler>();
builder.Services.AddScoped<GetHistorialProduccionQueryHandler>();
builder.Services.AddScoped<GetDashboardStatsQueryHandler>();

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

app.UseExceptionHandler();
app.UseHttpsRedirection();

app.MapIngredienteEndpoints();
app.MapProductoEndpoints();
app.MapProduccionEndpoints();
app.MapDashboardEndpoints();

app.Run();

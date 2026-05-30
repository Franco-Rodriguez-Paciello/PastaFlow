using Microsoft.EntityFrameworkCore;
using PastaFlow.API.Endpoints;
using PastaFlow.API.Middleware;
using PastaFlow.Application.Commands.Ingredientes;
using PastaFlow.Application.Commands.Productos;
using PastaFlow.Application.Interfaces;
using PastaFlow.Application.Queries.Ingredientes;
using PastaFlow.Application.Queries.Productos;
using PastaFlow.Infrastructure.Persistence;

var builder = WebApplication.CreateBuilder(args);

// .NET 10 built-in OpenAPI support (replaces Swashbuckle)
builder.Services.AddOpenApi();

builder.Services.AddExceptionHandler<GlobalExceptionHandler>();
builder.Services.AddProblemDetails();

// Persistencia
builder.Services.AddDbContext<PastaFlowDbContext>(options =>
    options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection")));

builder.Services.AddScoped<IPastaFlowDbContext, PastaFlowDbContext>();

// Handlers CQRS
builder.Services.AddScoped<RegistrarIngredienteCommandHandler>();
builder.Services.AddScoped<ActualizarCostoIngredienteCommandHandler>();
builder.Services.AddScoped<GetIngredientesQueryHandler>();
builder.Services.AddScoped<RegistrarProductoCommandHandler>();
builder.Services.AddScoped<AsignarRecetaCommandHandler>();
builder.Services.AddScoped<GetProductosQueryHandler>();
builder.Services.AddScoped<GetProductProfitabilityQueryHandler>();

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

app.UseExceptionHandler();
app.UseHttpsRedirection();

app.MapIngredienteEndpoints();
app.MapProductoEndpoints();

app.Run();

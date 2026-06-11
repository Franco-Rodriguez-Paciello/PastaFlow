using FluentValidation;
using Microsoft.AspNetCore.Diagnostics;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PastaFlow.Domain.Exceptions;

namespace PastaFlow.API.Middleware;

/// <summary>
/// Manejador global de excepciones (RFC 7807 Problem Details).
/// Captura excepciones no manejadas y las transforma en respuestas HTTP estructuradas,
/// eliminando la necesidad de bloques try-catch en endpoints y handlers.
/// </summary>
public sealed class CustomExceptionHandler(ILogger<CustomExceptionHandler> logger) : IExceptionHandler
{
    public async ValueTask<bool> TryHandleAsync(
        HttpContext httpContext,
        Exception exception,
        CancellationToken cancellationToken)
    {
        logger.LogError(exception, "Unhandled exception: {Message}", exception.Message);

        var problemDetails = exception switch
        {
            // FluentValidation: campo(s) con errores → 400 Bad Request
            ValidationException ve => BuildValidationProblem(ve),

            // Argumento inválido lanzado desde el dominio → 400 Bad Request
            ArgumentException => new ProblemDetails
            {
                Status = StatusCodes.Status400BadRequest,
                Title = "Datos inválidos",
                Detail = exception.Message
            },

            // Recurso no encontrado → 404 Not Found
            KeyNotFoundException => new ProblemDetails
            {
                Status = StatusCodes.Status404NotFound,
                Title = "Recurso no encontrado",
                Detail = exception.Message
            },

            // Invariante de dominio violada (stock insuficiente, etc.) → 409 Conflict
            InvalidDomainOperationException => new ProblemDetails
            {
                Status = StatusCodes.Status409Conflict,
                Title = "Regla de negocio violada",
                Detail = exception.Message
            },

            // Regla de negocio o estado inválido en capa de aplicación → 409 Conflict
            InvalidOperationException => new ProblemDetails
            {
                Status = StatusCodes.Status409Conflict,
                Title = "Operación no permitida",
                Detail = exception.Message
            },

            // Escritura concurrente detectada por xmin / RowVersion → 409 Conflict
            DbUpdateConcurrencyException => new ProblemDetails
            {
                Status = StatusCodes.Status409Conflict,
                Title = "Conflicto de concurrencia",
                Detail = "Los datos fueron modificados por otro usuario. Por favor, recarga la pantalla."
            },

            // Cualquier otro error no previsto → 500 Internal Server Error
            _ => new ProblemDetails
            {
                Status = StatusCodes.Status500InternalServerError,
                Title = "Error interno del servidor",
                Detail = "Un error inesperado ocurrió. Por favor, intente más tarde."
            }
        };

        httpContext.Response.StatusCode = problemDetails.Status!.Value;
        await httpContext.Response.WriteAsJsonAsync(problemDetails, cancellationToken);

        return true;
    }

    private static ProblemDetails BuildValidationProblem(ValidationException ve)
    {
        var errors = ve.Errors
            .GroupBy(e => e.PropertyName)
            .ToDictionary(
                g => g.Key,
                g => (object)g.Select(e => e.ErrorMessage).ToArray());

        var problem = new ProblemDetails
        {
            Status = StatusCodes.Status400BadRequest,
            Title = "Validación fallida",
            Detail = "Uno o más campos contienen errores."
        };

        problem.Extensions["errors"] = errors;
        return problem;
    }
}

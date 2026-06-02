using FluentValidation;

namespace PastaFlow.API.Middleware;

/// <summary>
/// Endpoint filter genérico que ejecuta FluentValidation antes de llegar al handler.
/// Si no hay validador registrado para <typeparamref name="T"/>, la petición pasa directamente.
/// </summary>
public sealed class ValidationFilter<T> : IEndpointFilter
{
    private readonly IValidator<T>? _validator;

    public ValidationFilter(IServiceProvider serviceProvider)
    {
        _validator = serviceProvider.GetService<IValidator<T>>();
    }

    public async ValueTask<object?> InvokeAsync(
        EndpointFilterInvocationContext context,
        EndpointFilterDelegate next)
    {
        if (_validator is null)
            return await next(context);

        T? argument = context.Arguments.OfType<T>().FirstOrDefault();
        if (argument is null)
            return await next(context);

        var result = await _validator.ValidateAsync(argument, context.HttpContext.RequestAborted);

        if (!result.IsValid)
            return Results.ValidationProblem(result.ToDictionary());

        return await next(context);
    }
}

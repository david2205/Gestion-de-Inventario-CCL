using Microsoft.AspNetCore.Mvc;

namespace InventoryApi.Middleware;

public class ExceptionHandlingMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<ExceptionHandlingMiddleware> _logger;

    public ExceptionHandlingMiddleware(RequestDelegate next, ILogger<ExceptionHandlingMiddleware> logger)
    {
        _next = next;
        _logger = logger;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        try
        {
            await _next(context);
        }
        catch (Exception exception)
        {
            _logger.LogError(exception, "Excepción no manejada en {Method} {Path}.",
                context.Request.Method, context.Request.Path);

            // No es posible reemplazar una respuesta cuyos encabezados ya se enviaron.
            if (context.Response.HasStarted)
            {
                throw;
            }

            var (statusCode, title) = exception switch
            {
                KeyNotFoundException => (StatusCodes.Status404NotFound, "Recurso no encontrado."),
                InvalidOperationException => (StatusCodes.Status409Conflict, "Conflicto al procesar la solicitud."),
                ArgumentException => (StatusCodes.Status400BadRequest, "Solicitud no válida."),
                _ => (StatusCodes.Status500InternalServerError, "Error interno del servidor.")
            };

            var problem = new ProblemDetails
            {
                Status = statusCode,
                Title = title,
                Detail = statusCode == StatusCodes.Status500InternalServerError
                    ? "Ocurrió un error inesperado al procesar la solicitud."
                    : exception.Message,
                Instance = context.Request.Path.Value
            };

            context.Response.Clear();
            context.Response.StatusCode = statusCode;

            await context.Response.WriteAsJsonAsync(problem,
                options: (System.Text.Json.JsonSerializerOptions?)null,
                contentType: "application/problem+json",
                cancellationToken: context.RequestAborted);
        }
    }
}

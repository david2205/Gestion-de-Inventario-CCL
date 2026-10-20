using InventoryApi.DTOs;
using InventoryApi.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace InventoryApi.Controllers;

[ApiController]
[Route("api/auth")]
[AllowAnonymous]
public class AuthController : ControllerBase
{
    private readonly IAuthService _authService;
    private readonly ILogger<AuthController> _logger;

    public AuthController(IAuthService authService, ILogger<AuthController> logger)
    {
        _authService = authService;
        _logger = logger;
    }

    [HttpPost("login")]
    [ProducesResponseType(typeof(AuthResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ValidationProblemDetails), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status500InternalServerError)]
    public async Task<ActionResult<AuthResponse>> Login([FromBody] LoginRequest request)
    {
        try
        {
            var response = await _authService.Login(request);
            return Ok(response);
        }
        catch (UnauthorizedAccessException exception)
        {
            return Problem(
                statusCode: StatusCodes.Status401Unauthorized,
                title: "No se pudo iniciar sesión.",
                detail: exception.Message);
        }
        catch (Exception exception)
        {
            _logger.LogError(exception, "Error al iniciar sesión.");
            return Problem(
                statusCode: StatusCodes.Status500InternalServerError,
                title: "Error al iniciar sesión.",
                detail: "Ocurrió un error inesperado al procesar la solicitud.");
        }
    }

    [HttpPost("register")]
    [ProducesResponseType(typeof(AuthResponse), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(ValidationProblemDetails), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status409Conflict)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status500InternalServerError)]
    public async Task<ActionResult<AuthResponse>> Register([FromBody] RegisterRequest request)
    {
        try
        {
            var response = await _authService.Register(request);
            return StatusCode(StatusCodes.Status201Created, response);
        }
        catch (DuplicateUsernameException exception)
        {
            return Problem(
                statusCode: StatusCodes.Status409Conflict,
                title: "El nombre de usuario ya existe.",
                detail: exception.Message);
        }
        catch (Exception exception)
        {
            _logger.LogError(exception, "Error al registrar el usuario.");
            return Problem(
                statusCode: StatusCodes.Status500InternalServerError,
                title: "Error al registrar el usuario.",
                detail: "Ocurrió un error inesperado al procesar la solicitud.");
        }
    }
}

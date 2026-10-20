using System.Security.Claims;
using InventoryApi.DTOs;
using InventoryApi.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Npgsql;

namespace InventoryApi.Controllers;

[ApiController]
[Route("api/inventory")]
[Authorize]
[ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status500InternalServerError)]
public class InventoryController : ControllerBase
{
    private readonly IInventoryService _inventoryService;
    private readonly ILogger<InventoryController> _logger;

    public InventoryController(IInventoryService inventoryService, ILogger<InventoryController> logger)
    {
        _inventoryService = inventoryService;
        _logger = logger;
    }

    [HttpPost("entries")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ValidationProblemDetails), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status409Conflict)]
    public Task<IActionResult> RegisterEntry([FromBody] InventoryMovementRequest request)
    {
        return RegisterMovement(
            userId => _inventoryService.RegisterEntry(request, userId),
            "Entrada de inventario registrada correctamente.");
    }

    [HttpPost("exits")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ValidationProblemDetails), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status409Conflict)]
    public Task<IActionResult> RegisterExit([FromBody] InventoryMovementRequest request)
    {
        return RegisterMovement(
            userId => _inventoryService.RegisterExit(request, userId),
            "Salida de inventario registrada correctamente.");
    }

    [HttpGet("current")]
    [ProducesResponseType(typeof(List<InventoryItemResponse>), StatusCodes.Status200OK)]
    public async Task<ActionResult<List<InventoryItemResponse>>> GetCurrentInventory()
    {
        try
        {
            return Ok(await _inventoryService.GetCurrentInventory());
        }
        catch (Exception exception)
        {
            return UnexpectedError(exception);
        }
    }

    [HttpGet("movements")]
    [ProducesResponseType(typeof(List<MovementHistoryResponse>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<List<MovementHistoryResponse>>> GetMovementHistory(
        [FromQuery] int? productId = null,
        [FromQuery] string? movementType = null,
        [FromQuery] DateTime? dateFrom = null,
        [FromQuery] DateTime? dateTo = null)
    {
        try
        {
            return Ok(await _inventoryService.GetMovementHistory(productId, movementType, dateFrom, dateTo));
        }
        catch (ArgumentException exception)
        {
            return InvalidRequest(exception);
        }
        catch (Exception exception)
        {
            return UnexpectedError(exception);
        }
    }

    private async Task<IActionResult> RegisterMovement(Func<int, Task> register, string successMessage)
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (!int.TryParse(userIdClaim, out var userId) || userId <= 0)
        {
            return Problem(
                statusCode: StatusCodes.Status401Unauthorized,
                title: "Usuario no válido.",
                detail: "El token no contiene un identificador de usuario válido.");
        }

        try
        {
            await register(userId);
            return Ok(new { message = successMessage });
        }
        catch (ArgumentException exception)
        {
            return InvalidRequest(exception);
        }
        catch (InvalidOperationException exception) when (
            exception.InnerException is PostgresException
            {
                SqlState: PostgresErrorCodes.RaiseException or PostgresErrorCodes.CheckViolation
            })
        {
            return Problem(
                statusCode: StatusCodes.Status409Conflict,
                title: "Conflicto al registrar el movimiento de inventario.",
                detail: exception.Message);
        }
        catch (InvalidOperationException exception) when (
            exception.InnerException is PostgresException
            {
                SqlState: PostgresErrorCodes.ForeignKeyViolation or PostgresErrorCodes.NotNullViolation
            })
        {
            return InvalidRequest(exception);
        }
        catch (Exception exception)
        {
            return UnexpectedError(exception);
        }
    }

    private ObjectResult InvalidRequest(Exception exception)
    {
        return Problem(
            statusCode: StatusCodes.Status400BadRequest,
            title: "Solicitud de inventario no válida.",
            detail: exception.Message);
    }

    private ObjectResult UnexpectedError(Exception exception)
    {
        _logger.LogError(exception, "Error al procesar una solicitud de inventario.");
        return Problem(
            statusCode: StatusCodes.Status500InternalServerError,
            title: "Error al procesar la solicitud.",
            detail: "Ocurrió un error inesperado al procesar la solicitud.");
    }
}

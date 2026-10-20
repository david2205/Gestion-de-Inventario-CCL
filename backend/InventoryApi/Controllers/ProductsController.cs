using InventoryApi.DTOs;
using InventoryApi.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace InventoryApi.Controllers;

[ApiController]
[Route("api/products")]
[Authorize]
[ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status500InternalServerError)]
public class ProductsController : ControllerBase
{
    private readonly IProductService _productService;
    private readonly ILogger<ProductsController> _logger;

    public ProductsController(IProductService productService, ILogger<ProductsController> logger)
    {
        _productService = productService;
        _logger = logger;
    }

    [HttpGet]
    [ProducesResponseType(typeof(List<ProductResponse>), StatusCodes.Status200OK)]
    public async Task<ActionResult<List<ProductResponse>>> GetAll()
    {
        try
        {
            return Ok(await _productService.GetAll());
        }
        catch (Exception exception)
        {
            return UnexpectedError(exception);
        }
    }

    [HttpGet("{id:int}")]
    [ProducesResponseType(typeof(ProductResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    public async Task<ActionResult<ProductResponse>> GetById(int id)
    {
        try
        {
            return Ok(await _productService.GetById(id));
        }
        catch (KeyNotFoundException exception)
        {
            return ProductNotFound(exception);
        }
        catch (Exception exception)
        {
            return UnexpectedError(exception);
        }
    }

    [HttpPost]
    [ProducesResponseType(typeof(ProductResponse), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(ValidationProblemDetails), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status409Conflict)]
    public async Task<ActionResult<ProductResponse>> Create([FromBody] CreateProductRequest request)
    {
        try
        {
            var response = await _productService.Create(request);
            return CreatedAtAction(nameof(GetById), new { id = response.Id }, response);
        }
        catch (DuplicateProductCodeException exception)
        {
            return Problem(
                statusCode: StatusCodes.Status409Conflict,
                title: "El código del producto ya existe.",
                detail: exception.Message);
        }
        catch (Exception exception)
        {
            return UnexpectedError(exception);
        }
    }

    [HttpPut("{id:int}")]
    [ProducesResponseType(typeof(ProductResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ValidationProblemDetails), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    public async Task<ActionResult<ProductResponse>> Update(int id, [FromBody] UpdateProductRequest request)
    {
        try
        {
            return Ok(await _productService.Update(id, request));
        }
        catch (KeyNotFoundException exception)
        {
            return ProductNotFound(exception);
        }
        catch (Exception exception)
        {
            return UnexpectedError(exception);
        }
    }

    [HttpDelete("{id:int}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Delete(int id)
    {
        try
        {
            await _productService.Delete(id);
            return NoContent();
        }
        catch (KeyNotFoundException exception)
        {
            return ProductNotFound(exception);
        }
        catch (Exception exception)
        {
            return UnexpectedError(exception);
        }
    }

    private ObjectResult ProductNotFound(KeyNotFoundException exception)
    {
        return Problem(
            statusCode: StatusCodes.Status404NotFound,
            title: "Producto no encontrado.",
            detail: exception.Message);
    }

    private ObjectResult UnexpectedError(Exception exception)
    {
        _logger.LogError(exception, "Error al procesar una solicitud de productos.");
        return Problem(
            statusCode: StatusCodes.Status500InternalServerError,
            title: "Error al procesar la solicitud.",
            detail: "Ocurrió un error inesperado al procesar la solicitud.");
    }
}

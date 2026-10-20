using InventoryApi.Data;
using InventoryApi.DTOs;
using InventoryApi.Models;
using Microsoft.EntityFrameworkCore;
using Npgsql;

namespace InventoryApi.Services;

public class ProductService : IProductService
{
    private readonly AppDbContext _context;

    public ProductService(AppDbContext context)
    {
        _context = context;
    }

    public async Task<List<ProductResponse>> GetAll()
    {
        var products = await _context.Products.AsNoTracking()
            .Where(product => product.IsActive)
            .OrderBy(product => product.Id)
            .ToListAsync();

        return products.Select(MapToResponse).ToList();
    }

    public async Task<ProductResponse> GetById(int id)
    {
        var product = await _context.Products.AsNoTracking()
            .SingleOrDefaultAsync(product => product.Id == id && product.IsActive)
            ?? throw new KeyNotFoundException($"No se encontró el producto con Id {id}.");

        return MapToResponse(product);
    }

    public async Task<ProductResponse> Create(CreateProductRequest request)
    {
        if (await _context.Products.AnyAsync(product => product.Code == request.Code))
        {
            throw new DuplicateProductCodeException(request.Code);
        }

        var now = DateTime.UtcNow;
        var product = new Product
        {
            Code = request.Code,
            Name = request.Name,
            Description = request.Description,
            Stock = 0,
            MinStock = request.MinStock,
            IsActive = true,
            CreatedAt = now,
            UpdatedAt = now
        };

        _context.Products.Add(product);

        try
        {
            await _context.SaveChangesAsync();
        }
        catch (DbUpdateException exception) when (
            exception.InnerException is PostgresException
            {
                SqlState: PostgresErrorCodes.UniqueViolation,
                ConstraintName: "IX_products_code"
            })
        {
            _context.Entry(product).State = EntityState.Detached;
            throw new DuplicateProductCodeException(request.Code, exception);
        }

        return MapToResponse(product);
    }

    public async Task<ProductResponse> Update(int id, UpdateProductRequest request)
    {
        var product = await GetActiveProduct(id);

        product.Name = request.Name;
        product.Description = request.Description;
        product.MinStock = request.MinStock;
        product.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        return MapToResponse(product);
    }

    public async Task Delete(int id)
    {
        var product = await GetActiveProduct(id);

        product.IsActive = false;
        product.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();
    }

    private async Task<Product> GetActiveProduct(int id)
    {
        return await _context.Products
            .SingleOrDefaultAsync(product => product.Id == id && product.IsActive)
            ?? throw new KeyNotFoundException($"No se encontró el producto con Id {id}.");
    }

    private static ProductResponse MapToResponse(Product product)
    {
        return new ProductResponse
        {
            Id = product.Id,
            Code = product.Code,
            Name = product.Name,
            Description = product.Description,
            Stock = product.Stock,
            MinStock = product.MinStock,
            IsActive = product.IsActive,
            CreatedAt = product.CreatedAt,
            UpdatedAt = product.UpdatedAt
        };
    }
}

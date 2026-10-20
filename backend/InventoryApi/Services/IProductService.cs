using InventoryApi.DTOs;

namespace InventoryApi.Services;

public interface IProductService
{
    Task<List<ProductResponse>> GetAll();

    Task<ProductResponse> GetById(int id);

    Task<ProductResponse> Create(CreateProductRequest request);

    Task<ProductResponse> Update(int id, UpdateProductRequest request);

    Task Delete(int id);
}

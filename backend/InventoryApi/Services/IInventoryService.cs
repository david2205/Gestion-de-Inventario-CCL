using InventoryApi.DTOs;

namespace InventoryApi.Services;

public interface IInventoryService
{
    Task RegisterEntry(InventoryMovementRequest request, int userId);

    Task RegisterExit(InventoryMovementRequest request, int userId);

    Task<List<InventoryItemResponse>> GetCurrentInventory();

    Task<List<MovementHistoryResponse>> GetMovementHistory(
        int? productId, string? movementType, DateTime? dateFrom, DateTime? dateTo);
}

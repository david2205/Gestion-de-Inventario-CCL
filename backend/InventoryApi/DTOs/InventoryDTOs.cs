using System.ComponentModel.DataAnnotations;

namespace InventoryApi.DTOs;

public class InventoryMovementRequest
{
    [Required]
    public int ProductId { get; set; }

    [Required]
    [Range(1, int.MaxValue)]
    public int Quantity { get; set; }

    public string? Note { get; set; }
}

public class InventoryItemResponse
{
    public int ProductId { get; set; }

    public string ProductCode { get; set; } = string.Empty;

    public string ProductName { get; set; } = string.Empty;

    public string? Description { get; set; }

    public int CurrentStock { get; set; }

    public int MinStock { get; set; }

    public bool IsLowStock { get; set; }

    public DateTime? LastEntryDate { get; set; }

    public DateTime? LastExitDate { get; set; }
}

public class MovementHistoryResponse
{
    public int MovementId { get; set; }

    public string ProductCode { get; set; } = string.Empty;

    public string ProductName { get; set; } = string.Empty;

    public string MovementType { get; set; } = string.Empty;

    public int Quantity { get; set; }

    public int PreviousStock { get; set; }

    public int NewStock { get; set; }

    public string? Note { get; set; }

    public string Username { get; set; } = string.Empty;

    public DateTime CreatedAt { get; set; }
}

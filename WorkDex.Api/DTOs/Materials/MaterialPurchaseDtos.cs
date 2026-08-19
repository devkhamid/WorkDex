using System.ComponentModel.DataAnnotations;

namespace WorkDex.Api.DTOs.Materials;

public class CreateMaterialPurchaseDto
{
    [Required]
    public Guid MaterialId { get; set; }

    [Required]
    [Range(0.01, double.MaxValue, ErrorMessage = "Miqdor 0 dan katta bo'lishi kerak.")]
    public decimal Quantity { get; set; }

    [Required]
    [Range(0.01, double.MaxValue, ErrorMessage = "Birlik narxi 0 dan katta bo'lishi kerak.")]
    public decimal UnitPrice { get; set; }

    [MaxLength(200)]
    public string? Supplier { get; set; }

    [Required]
    public DateTime PurchaseDate { get; set; }

    [MaxLength(100)]
    public string? ReceiptNumber { get; set; }

    [MaxLength(1000)]
    public string? Notes { get; set; }
}

public class MaterialPurchaseDto
{
    public Guid Id { get; set; }
    public Guid ProjectId { get; set; }
    public Guid MaterialId { get; set; }
    public string MaterialName { get; set; } = string.Empty;
    public decimal Quantity { get; set; }
    public string Unit { get; set; } = string.Empty;
    public decimal UnitPrice { get; set; }
    public decimal TotalCost { get; set; }
    public string? Supplier { get; set; }
    public DateTime PurchaseDate { get; set; }
    public string? ReceiptNumber { get; set; }
    public string? Notes { get; set; }
    public Guid CreatedByUserId { get; set; }
    public string CreatedByName { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
}

public class ProjectMaterialSummaryDto
{
    public Guid MaterialId { get; set; }
    public string MaterialName { get; set; } = string.Empty;
    public string Unit { get; set; } = string.Empty;
    public decimal TotalQuantity { get; set; }
    public decimal TotalCost { get; set; }
    public int PurchaseCount { get; set; }
}

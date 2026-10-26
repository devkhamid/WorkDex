namespace WorkDex.Api.Models;

public class MaterialPurchase
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid ProjectId { get; set; }
    public Guid MaterialId { get; set; }

    public decimal Quantity { get; set; }
    public string Unit { get; set; } = string.Empty;
    public decimal UnitPrice { get; set; }
    public decimal TotalCost { get; set; }
    public string? Brand { get; set; }    public string? Supplier { get; set; }    public DateTime PurchaseDate { get; set; }
    public string? ReceiptNumber { get; set; }    public string? Notes { get; set; }

    public string Currency { get; set; } = "UZS";    public decimal? ExchangeRateToUzs { get; set; }    public decimal? OriginalUnitPrice { get; set; }
    public Guid CreatedByUserId { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public Project Project { get; set; } = null!;
    public Material Material { get; set; } = null!;
    public User CreatedByUser { get; set; } = null!;
}

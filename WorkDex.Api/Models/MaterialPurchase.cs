namespace WorkDex.Api.Models;

// PDF §5 — Loyiha bo'yicha material xaridi
public class MaterialPurchase
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid ProjectId { get; set; }
    public Guid MaterialId { get; set; }

    public decimal Quantity { get; set; }
    public string Unit { get; set; } = string.Empty;
    public decimal UnitPrice { get; set; }
    public decimal TotalCost { get; set; } // Quantity * UnitPrice

    public string? Brand { get; set; } // Brend / ishlab chiqaruvchi
    public string? Supplier { get; set; } // Yetkazib beruvchi / do'kon nomi
    public DateTime PurchaseDate { get; set; }
    public string? ReceiptNumber { get; set; } // Hisob-faktura yoki chek raqami
    public string? Notes { get; set; }

    public Guid CreatedByUserId { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public Project Project { get; set; } = null!;
    public Material Material { get; set; } = null!;
    public User CreatedByUser { get; set; } = null!;
}

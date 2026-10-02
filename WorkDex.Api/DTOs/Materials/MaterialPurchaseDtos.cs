using System.ComponentModel.DataAnnotations;

namespace WorkDex.Api.DTOs.Materials;

public class CreateMaterialPurchaseDto
{
    // MaterialId yoki MaterialName berilishi kerak. MaterialName berilsa, server katalogdan
    // nom+brend bo'yicha (katta-kichik harf va ortiqcha bo'shliqlarsiz) qidiradi, topilmasa yaratadi.
    public Guid? MaterialId { get; set; }

    [MaxLength(200)]
    public string? MaterialName { get; set; }

    [MaxLength(200)]
    public string? Brand { get; set; } // Brend

    [MaxLength(50)]
    public string? Unit { get; set; } // Faqat yangi material yaratilganda ishlatiladi

    [Required]
    [Range(0.01, double.MaxValue, ErrorMessage = "Miqdor 0 dan katta bo'lishi kerak.")]
    public decimal Quantity { get; set; }

    [Required]
    [Range(0.01, double.MaxValue, ErrorMessage = "Birlik narxi 0 dan katta bo'lishi kerak.")]
    public decimal UnitPrice { get; set; }

    // UnitPrice — Currency ("UZS"/"USD") dagi birlik narxi; kurs serverda CBU dan olinadi
    [MaxLength(3)]
    public string Currency { get; set; } = "UZS";

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
    public string? Brand { get; set; }
    public decimal Quantity { get; set; }
    public string Unit { get; set; } = string.Empty;
    public decimal UnitPrice { get; set; }
    public decimal TotalCost { get; set; } // so'm
    public decimal TotalCostUsd { get; set; }
    public string Currency { get; set; } = "UZS";
    public decimal? ExchangeRateToUzs { get; set; }
    public decimal? OriginalUnitPrice { get; set; }
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
    public string? Brand { get; set; }
    public string Unit { get; set; } = string.Empty;
    public decimal TotalQuantity { get; set; }
    public decimal TotalCost { get; set; }
    public decimal TotalCostUsd { get; set; }
    public int PurchaseCount { get; set; }
}

// Qaysi loyihada qaysi brenddagi qaysi materialdan qancha va necha pullik ishlatilgani
public class MaterialUsageDto
{
    public Guid MaterialId { get; set; }
    public string MaterialName { get; set; } = string.Empty;
    public string? Brand { get; set; }
    public string Unit { get; set; } = string.Empty;
    public Guid ProjectId { get; set; }
    public string ProjectName { get; set; } = string.Empty;
    public decimal TotalQuantity { get; set; }
    public decimal TotalCost { get; set; } // so'm
    public decimal TotalCostUsd { get; set; }
    public decimal AverageUnitPrice { get; set; } // so'm
    public int PurchaseCount { get; set; }
    public DateTime LastPurchaseDate { get; set; }
}

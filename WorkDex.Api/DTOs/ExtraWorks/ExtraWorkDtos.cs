using System.ComponentModel.DataAnnotations;

namespace WorkDex.Api.DTOs.ExtraWorks;

public class CreateExtraWorkDto
{
    [Required]
    [MaxLength(300)]
    public string Title { get; set; } = string.Empty;

    [MaxLength(2000)]
    public string? Description { get; set; }

    [Required]
    [Range(0, double.MaxValue, ErrorMessage = "Mijoz summasi manfiy bo'lishi mumkin emas.")]
    public decimal CustomerAmount { get; set; }

    [Required]
    [Range(0, double.MaxValue, ErrorMessage = "Tannarx summasi manfiy bo'lishi mumkin emas.")]
    public decimal ActualCost { get; set; }

    [MaxLength(3)]
    public string Currency { get; set; } = "USD";

    public bool IsApprovedByCustomer { get; set; } = false;

    [MaxLength(1000)]
    public string? Notes { get; set; }
}

public class UpdateExtraWorkDto
{
    [Required]
    [MaxLength(300)]
    public string Title { get; set; } = string.Empty;

    [MaxLength(2000)]
    public string? Description { get; set; }

    [Required]
    [Range(0, double.MaxValue)]
    public decimal CustomerAmount { get; set; }

    [Required]
    [Range(0, double.MaxValue)]
    public decimal ActualCost { get; set; }

    [MaxLength(3)]
    public string Currency { get; set; } = "USD";

    public bool IsApprovedByCustomer { get; set; }

    [MaxLength(1000)]
    public string? Notes { get; set; }
}

public class ExtraWorkDto
{
    public Guid Id { get; set; }
    public Guid ProjectId { get; set; }
    public string Title { get; set; } = string.Empty;
    public string? Description { get; set; }
    public decimal CustomerAmount { get; set; }
    public decimal ActualCost { get; set; }
    public string Currency { get; set; } = "USD";
    public decimal? ExchangeRate { get; set; }
    public decimal? OriginalCustomerAmount { get; set; }
    public decimal? OriginalActualCost { get; set; }
    public decimal CustomerAmountUzs { get; set; }
    public decimal ActualCostUzs { get; set; }
    public decimal ProfitImpact => CustomerAmount - ActualCost;    public bool IsApprovedByCustomer { get; set; }
    public DateTime? ApprovedAt { get; set; }
    public string? Notes { get; set; }
    public Guid CreatedByUserId { get; set; }
    public string CreatedByName { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
}

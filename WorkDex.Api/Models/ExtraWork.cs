namespace WorkDex.Api.Models;

public class ExtraWork
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid ProjectId { get; set; }

    public string Title { get; set; } = string.Empty;    public string? Description { get; set; }
    public decimal CustomerAmount { get; set; }    public decimal ActualCost { get; set; }
    public string Currency { get; set; } = "USD";
    public decimal? ExchangeRate { get; set; }
    public decimal? OriginalCustomerAmount { get; set; }
    public decimal? OriginalActualCost { get; set; }

    public bool IsApprovedByCustomer { get; set; } = false;    public DateTime? ApprovedAt { get; set; }

    public string? Notes { get; set; }

    public Guid CreatedByUserId { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public Project Project { get; set; } = null!;
    public User CreatedByUser { get; set; } = null!;
}

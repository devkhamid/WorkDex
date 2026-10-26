namespace WorkDex.Api.Models;

public class WorkerPayment
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid ProjectId { get; set; }
    public Guid WorkerId { get; set; }

    public string JobDescription { get; set; } = string.Empty;    public decimal AgreedAmount { get; set; }    public decimal WorkAmount { get; set; }    public decimal PaidAmount { get; set; }
    public DateTime? PaymentDate { get; set; }
    public string? Notes { get; set; }

    public string Currency { get; set; } = "UZS";    public decimal? ExchangeRateToUzs { get; set; }    public decimal? OriginalAgreedAmount { get; set; }
    public Guid CreatedByUserId { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public Project Project { get; set; } = null!;
    public Worker Worker { get; set; } = null!;
    public User CreatedByUser { get; set; } = null!;
}

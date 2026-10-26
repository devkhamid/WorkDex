namespace WorkDex.Api.Models;

public class Payment
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid ProjectId { get; set; }

    public decimal Amount { get; set; }
    public string Currency { get; set; } = "USD";
    public decimal? ExchangeRate { get; set; }
    public decimal? OriginalAmount { get; set; }

    public PaymentMethod PaymentMethod { get; set; }
    public DateTime PaymentDate { get; set; }

    public string? Notes { get; set; }

    public Guid ReceivedByUserId { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public Project Project { get; set; } = null!;
    public User ReceivedByUser { get; set; } = null!;
}

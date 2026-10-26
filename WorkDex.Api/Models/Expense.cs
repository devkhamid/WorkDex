namespace WorkDex.Api.Models;

public class Expense
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid? ProjectId { get; set; }
    public ExpenseCategory Category { get; set; }
    public ExpenseFrequency Frequency { get; set; } = ExpenseFrequency.OneTime;
    public decimal Amount { get; set; }

    public string Description { get; set; } = string.Empty;
    public DateTime ExpenseDate { get; set; }
    public string? Notes { get; set; }

    public string Currency { get; set; } = "UZS";    public decimal? ExchangeRateToUzs { get; set; }    public decimal? OriginalAmount { get; set; }
    public Guid CreatedByUserId { get; set; }
    public Guid? CompanyAdminId { get; set; }    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public Project? Project { get; set; }
    public User CreatedByUser { get; set; } = null!;
}

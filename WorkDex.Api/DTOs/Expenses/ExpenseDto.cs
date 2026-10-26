using WorkDex.Api.Models;

namespace WorkDex.Api.DTOs.Expenses;

public class ExpenseDto
{
    public Guid Id { get; set; }
    public Guid? ProjectId { get; set; }
    public ExpenseCategory Category { get; set; }
    public string CategoryName { get; set; } = string.Empty;
    public ExpenseFrequency Frequency { get; set; }
    public string FrequencyName { get; set; } = string.Empty;
    public decimal Amount { get; set; }    public decimal AmountUsd { get; set; }
    public string Currency { get; set; } = "UZS";
    public decimal? ExchangeRateToUzs { get; set; }
    public decimal? OriginalAmount { get; set; }
    public string Description { get; set; } = string.Empty;
    public DateTime ExpenseDate { get; set; }
    public string? Notes { get; set; }
    public Guid CreatedByUserId { get; set; }
    public string CreatedByName { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
}

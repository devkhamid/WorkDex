namespace WorkDex.Api.Models;

// PDF §4 — Loyiha xarajatlari (7 kategoriya)
public class Expense
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid? ProjectId { get; set; }  // NULL = ofis/kompaniya xarajati

    public ExpenseCategory Category { get; set; }
    public ExpenseFrequency Frequency { get; set; } = ExpenseFrequency.OneTime;
    public decimal Amount { get; set; }

    public string Description { get; set; } = string.Empty;
    public DateTime ExpenseDate { get; set; }
    public string? Notes { get; set; }

    public Guid CreatedByUserId { get; set; }
    public Guid? CompanyAdminId { get; set; }  // Tenant izolyatsiya
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public Project? Project { get; set; }
    public User CreatedByUser { get; set; } = null!;
}

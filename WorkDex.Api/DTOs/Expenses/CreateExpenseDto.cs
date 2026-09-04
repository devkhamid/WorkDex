using System.ComponentModel.DataAnnotations;
using WorkDex.Api.Models;

namespace WorkDex.Api.DTOs.Expenses;

public class CreateExpenseDto
{
    [Required]
    public ExpenseCategory Category { get; set; }

    public ExpenseFrequency Frequency { get; set; } = ExpenseFrequency.OneTime;

    [Required]
    [Range(0.01, double.MaxValue, ErrorMessage = "Xarajat summasi 0 dan katta bo'lishi kerak.")]
    public decimal Amount { get; set; }

    [Required]
    [MaxLength(500)]
    public string Description { get; set; } = string.Empty;

    [Required]
    public DateTime ExpenseDate { get; set; }

    [MaxLength(1000)]
    public string? Notes { get; set; }
}

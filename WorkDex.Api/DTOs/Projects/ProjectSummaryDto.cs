using WorkDex.Api.Models;

namespace WorkDex.Api.DTOs.Projects;

// PDF §4 — Loyiha moliyaviy xulosasi
public class ProjectSummaryDto
{
    public Guid ProjectId { get; set; }
    public string ProjectName { get; set; } = string.Empty;
    public string CustomerName { get; set; } = string.Empty;
    public decimal ContractAmount { get; set; }
    public decimal? ContractAmountUzs { get; set; } // UZS da kiritilgan asl shartnoma summasi
    public string Currency { get; set; } = "USD";
    public decimal? ExchangeRate { get; set; }

    // To'lovlar (USD va UZS)
    public decimal TotalPaid { get; set; }
    public decimal TotalPaidUzs { get; set; }
    public decimal RemainingPayment { get; set; }
    public decimal RemainingPaymentUzs { get; set; }

    // Xarajatlar va Qo'shimcha ishlar (USD da)
    public decimal MaterialExpenses { get; set; }
    public decimal LaborExpenses { get; set; }
    public decimal OtherExpenses { get; set; }
    public decimal ExtraWorkIncome { get; set; } // PDF §7: Tasdiqlangan qo'shimcha ishlar summasi
    public decimal ExtraWorkCost { get; set; } // PDF §7: Qo'shimcha ishlar tannarxi
    public decimal TotalExpenses { get; set; }

    // Xarajatlar va Qo'shimcha ishlar (UZS da)
    public decimal MaterialExpensesUzs { get; set; }
    public decimal LaborExpensesUzs { get; set; }
    public decimal OtherExpensesUzs { get; set; }
    public decimal TotalExpensesUzs { get; set; }

    // Hisoblangan ko'rsatkichlar (USD da)
    public decimal BudgetUtilizationPercent { get; set; }
    public decimal GrossProfit { get; set; }
    public decimal NetBalance { get; set; } // Olingan to'lov - Jami xarajatlar (USD)
    public decimal RemainingBudget { get; set; }

    // Hisoblangan ko'rsatkichlar (UZS da)
    public decimal GrossProfitUzs { get; set; }
    public decimal NetBalanceUzs { get; set; } // Olingan to'lov - Jami xarajatlar (UZS)

    public decimal ProgressPercent { get; set; }
    public ProjectStatus Status { get; set; }
}

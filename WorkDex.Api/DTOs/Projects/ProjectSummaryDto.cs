using WorkDex.Api.Models;

namespace WorkDex.Api.DTOs.Projects;

public class ProjectSummaryDto
{
    public Guid ProjectId { get; set; }
    public string ProjectName { get; set; } = string.Empty;
    public string CustomerName { get; set; } = string.Empty;
    public decimal ContractAmount { get; set; }
    public decimal? ContractAmountUzs { get; set; }    public string Currency { get; set; } = "USD";
    public decimal? ExchangeRate { get; set; }

    public decimal TotalPaid { get; set; }
    public decimal TotalPaidUzs { get; set; }
    public decimal RemainingPayment { get; set; }
    public decimal RemainingPaymentUzs { get; set; }

    public decimal MaterialExpenses { get; set; }
    public decimal LaborExpenses { get; set; }
    public decimal OtherExpenses { get; set; }
    public decimal ExtraWorkIncome { get; set; }    public decimal ExtraWorkCost { get; set; }    public decimal TotalExpenses { get; set; }

    public decimal MaterialExpensesUzs { get; set; }
    public decimal LaborExpensesUzs { get; set; }
    public decimal OtherExpensesUzs { get; set; }
    public decimal TotalExpensesUzs { get; set; }

    public decimal BudgetUtilizationPercent { get; set; }
    public decimal GrossProfit { get; set; }
    public decimal NetBalance { get; set; }    public decimal RemainingBudget { get; set; }

    public decimal GrossProfitUzs { get; set; }
    public decimal NetBalanceUzs { get; set; }
    public decimal ProgressPercent { get; set; }
    public ProjectStatus Status { get; set; }
}

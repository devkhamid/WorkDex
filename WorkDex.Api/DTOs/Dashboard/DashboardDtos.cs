using WorkDex.Api.Models;

namespace WorkDex.Api.DTOs.Dashboard;

public class DashboardStatsDto
{
    public int TotalProjects { get; set; }
    public int ActiveProjects { get; set; }    public int CompletedProjects { get; set; }
    public int OnHoldProjects { get; set; }

    public decimal TotalContractValue { get; set; }    public decimal TotalRevenueReceived { get; set; }    public decimal TotalPendingReceivables { get; set; }    public decimal TotalExpenses { get; set; }    public decimal TotalNetProfit { get; set; }    public decimal NetBalance { get; set; }
    public decimal TotalContractValueUzs { get; set; }
    public decimal TotalRevenueReceivedUzs { get; set; }
    public decimal TotalPendingReceivablesUzs { get; set; }
    public decimal TotalExpensesUzs { get; set; }
    public decimal TotalNetProfitUzs { get; set; }
    public decimal NetBalanceUzs { get; set; }

    public decimal AverageBudgetUtilizationPercent { get; set; }
    public int AtRiskProjectsCount { get; set; }}

public class ProjectStatusDistributionDto
{
    public ProjectStatus Status { get; set; }
    public string StatusName { get; set; } = string.Empty;
    public int Count { get; set; }
    public decimal TotalValue { get; set; }
}

public class DashboardRecentActivityDto
{
    public string ActivityType { get; set; } = string.Empty;    public string Title { get; set; } = string.Empty;
    public string ProjectName { get; set; } = string.Empty;
    public decimal? Amount { get; set; }    public decimal? AmountUzs { get; set; }
    public string CreatedByName { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
}

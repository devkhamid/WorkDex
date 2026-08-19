using WorkDex.Api.Models;

namespace WorkDex.Api.DTOs.Dashboard;

// PDF §9 — Rahbariyat Dashboardi statistikasi
public class DashboardStatsDto
{
    public int TotalProjects { get; set; }
    public int ActiveProjects { get; set; } // Planning + InProgress
    public int CompletedProjects { get; set; }
    public int OnHoldProjects { get; set; }

    public decimal TotalContractValue { get; set; } // Shartnoma + tasdiqlangan qo'shimcha ishlar
    public decimal TotalRevenueReceived { get; set; } // Olingan jami tushum
    public decimal TotalPendingReceivables { get; set; } // Mijozlardan kutilayotgan qoldiq tushum
    public decimal TotalExpenses { get; set; } // Jami xarajatlar (Material + Usta + Boshqa + Qo'shimcha tannarx)
    public decimal TotalNetProfit { get; set; } // Sof/Yalpi foyda

    public decimal AverageBudgetUtilizationPercent { get; set; }
    public int AtRiskProjectsCount { get; set; } // Byudjetdan 90% dan ko'prog'i sarflangan yoki oshib ketgan loyihalar
}

public class ProjectStatusDistributionDto
{
    public ProjectStatus Status { get; set; }
    public string StatusName { get; set; } = string.Empty;
    public int Count { get; set; }
    public decimal TotalValue { get; set; }
}

public class DashboardRecentActivityDto
{
    public string ActivityType { get; set; } = string.Empty; // Payment, Expense, MaterialPurchase, WorkerPayment, ProjectUpdate
    public string Title { get; set; } = string.Empty;
    public string ProjectName { get; set; } = string.Empty;
    public decimal? Amount { get; set; }
    public string CreatedByName { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
}

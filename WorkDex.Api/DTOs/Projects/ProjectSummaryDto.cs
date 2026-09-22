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

    // To'lovlar (Phase 8 da real ma'lumotlar bilan to'ldiriladi)
    public decimal TotalPaid { get; set; }
    public decimal RemainingPayment { get; set; }

    // Xarajatlar va Qo'shimcha ishlar
    public decimal MaterialExpenses { get; set; }
    public decimal LaborExpenses { get; set; }
    public decimal OtherExpenses { get; set; }
    public decimal ExtraWorkIncome { get; set; } // PDF §7: Tasdiqlangan qo'shimcha ishlar summasi
    public decimal ExtraWorkCost { get; set; } // PDF §7: Qo'shimcha ishlar tannarxi
    public decimal TotalExpenses { get; set; }

    // Hisoblangan ko'rsatkichlar
    public decimal BudgetUtilizationPercent { get; set; }
    public decimal GrossProfit { get; set; }
    public decimal NetBalance { get; set; } // Olingan to'lov - Jami xarajatlar (Qo'ldagi real summa)
    public decimal RemainingBudget { get; set; }

    public decimal ProgressPercent { get; set; }
    public ProjectStatus Status { get; set; }
}

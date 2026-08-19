using Microsoft.EntityFrameworkCore;
using WorkDex.Api.Data;
using WorkDex.Api.DTOs.Dashboard;
using WorkDex.Api.Models;

namespace WorkDex.Api.Services;

public class DashboardService : IDashboardService
{
    private readonly AppDbContext _context;

    public DashboardService(AppDbContext context)
    {
        _context = context;
    }

    public async Task<DashboardStatsDto> GetStatsAsync()
    {
        var projects = await _context.Projects
            .Include(p => p.ExtraWorks)
            .Include(p => p.MaterialPurchases)
            .Include(p => p.WorkerPayments)
            .ToListAsync();

        var totalProjects = projects.Count;
        var activeProjects = projects.Count(p => p.Status == ProjectStatus.Planning || p.Status == ProjectStatus.InProgress);
        var completedProjects = projects.Count(p => p.Status == ProjectStatus.Completed);
        var onHoldProjects = projects.Count(p => p.Status == ProjectStatus.OnHold);

        // Shartnomalar + tasdiqlangan qo'shimcha ishlar
        var baseContractValue = projects.Sum(p => p.ContractAmount);
        var approvedExtraWorksValue = await _context.ExtraWorks
            .Where(ew => ew.IsApprovedByCustomer)
            .SumAsync(ew => (decimal?)ew.CustomerAmount) ?? 0;
        var totalContractValue = baseContractValue + approvedExtraWorksValue;

        // Olingan tushumlar
        var totalRevenue = await _context.Payments.SumAsync(p => (decimal?)p.Amount) ?? 0;
        var totalPendingReceivables = totalContractValue - totalRevenue;

        // Jami xarajatlar
        var totalMaterialExpenses = (await _context.MaterialPurchases.SumAsync(mp => (decimal?)mp.TotalCost) ?? 0)
            + (await _context.Expenses.Where(e => e.Category == ExpenseCategory.Material).SumAsync(e => (decimal?)e.Amount) ?? 0);

        var totalLaborExpenses = (await _context.WorkerPayments.SumAsync(wp => (decimal?)wp.PaidAmount) ?? 0)
            + (await _context.Expenses.Where(e => e.Category == ExpenseCategory.Labor).SumAsync(e => (decimal?)e.Amount) ?? 0);

        var totalOtherExpenses = await _context.Expenses
            .Where(e => e.Category != ExpenseCategory.Material && e.Category != ExpenseCategory.Labor)
            .SumAsync(e => (decimal?)e.Amount) ?? 0;

        var totalExtraWorkCost = await _context.ExtraWorks
            .Where(ew => ew.IsApprovedByCustomer)
            .SumAsync(ew => (decimal?)ew.ActualCost) ?? 0;

        var totalExpenses = totalMaterialExpenses + totalLaborExpenses + totalOtherExpenses + totalExtraWorkCost;
        var totalNetProfit = totalContractValue - totalExpenses;

        // Byudjetdan oshish xavfi bor loyihalar
        var atRiskCount = 0;
        decimal totalBudgetUtilization = 0;

        foreach (var p in projects)
        {
            var pMat = (p.MaterialPurchases?.Sum(mp => mp.TotalCost) ?? 0)
                + (await _context.Expenses.Where(e => e.ProjectId == p.Id && e.Category == ExpenseCategory.Material).SumAsync(e => (decimal?)e.Amount) ?? 0);

            var pLab = (p.WorkerPayments?.Sum(wp => wp.PaidAmount) ?? 0)
                + (await _context.Expenses.Where(e => e.ProjectId == p.Id && e.Category == ExpenseCategory.Labor).SumAsync(e => (decimal?)e.Amount) ?? 0);

            var pOth = await _context.Expenses
                .Where(e => e.ProjectId == p.Id && e.Category != ExpenseCategory.Material && e.Category != ExpenseCategory.Labor)
                .SumAsync(e => (decimal?)e.Amount) ?? 0;

            var pExtra = p.ExtraWorks?.Where(ew => ew.IsApprovedByCustomer).Sum(ew => ew.ActualCost) ?? 0;
            var pExp = pMat + pLab + pOth + pExtra;

            if (p.Budget > 0)
            {
                var util = pExp / p.Budget * 100;
                totalBudgetUtilization += util;
                if (util >= 90) atRiskCount++;
            }
        }

        var avgUtilization = totalProjects > 0 ? Math.Round(totalBudgetUtilization / totalProjects, 2) : 0;

        return new DashboardStatsDto
        {
            TotalProjects = totalProjects,
            ActiveProjects = activeProjects,
            CompletedProjects = completedProjects,
            OnHoldProjects = onHoldProjects,
            TotalContractValue = totalContractValue,
            TotalRevenueReceived = totalRevenue,
            TotalPendingReceivables = totalPendingReceivables,
            TotalExpenses = totalExpenses,
            TotalNetProfit = totalNetProfit,
            AverageBudgetUtilizationPercent = avgUtilization,
            AtRiskProjectsCount = atRiskCount
        };
    }

    public async Task<List<ProjectStatusDistributionDto>> GetStatusDistributionAsync()
    {
        var groups = await _context.Projects
            .GroupBy(p => p.Status)
            .Select(g => new ProjectStatusDistributionDto
            {
                Status = g.Key,
                StatusName = g.Key.ToString(),
                Count = g.Count(),
                TotalValue = g.Sum(p => p.ContractAmount)
            })
            .ToListAsync();

        return groups;
    }

    public async Task<List<DashboardRecentActivityDto>> GetRecentActivitiesAsync(int limit = 10)
    {
        var activities = new List<DashboardRecentActivityDto>();

        // Payments
        var payments = await _context.Payments
            .Include(p => p.Project)
            .Include(p => p.ReceivedByUser)
            .OrderByDescending(p => p.CreatedAt)
            .Take(limit)
            .Select(p => new DashboardRecentActivityDto
            {
                ActivityType = "Payment",
                Title = $"Mijoz to'lovi qabul qilindi ({p.PaymentMethod})",
                ProjectName = p.Project.Name,
                Amount = p.Amount,
                CreatedByName = p.ReceivedByUser.FullName,
                CreatedAt = p.CreatedAt
            })
            .ToListAsync();

        // Expenses
        var expenses = await _context.Expenses
            .Include(e => e.Project)
            .Include(e => e.CreatedByUser)
            .OrderByDescending(e => e.CreatedAt)
            .Take(limit)
            .Select(e => new DashboardRecentActivityDto
            {
                ActivityType = "Expense",
                Title = $"{e.Category} xarajati: {e.Description}",
                ProjectName = e.Project.Name,
                Amount = e.Amount,
                CreatedByName = e.CreatedByUser.FullName,
                CreatedAt = e.CreatedAt
            })
            .ToListAsync();

        // Material Purchases
        var materials = await _context.MaterialPurchases
            .Include(mp => mp.Project)
            .Include(mp => mp.Material)
            .Include(mp => mp.CreatedByUser)
            .OrderByDescending(mp => mp.CreatedAt)
            .Take(limit)
            .Select(mp => new DashboardRecentActivityDto
            {
                ActivityType = "MaterialPurchase",
                Title = $"Material xaridi: {mp.Material.Name} ({mp.Quantity} {mp.Unit})",
                ProjectName = mp.Project.Name,
                Amount = mp.TotalCost,
                CreatedByName = mp.CreatedByUser.FullName,
                CreatedAt = mp.CreatedAt
            })
            .ToListAsync();

        activities.AddRange(payments);
        activities.AddRange(expenses);
        activities.AddRange(materials);

        return activities
            .OrderByDescending(a => a.CreatedAt)
            .Take(limit)
            .ToList();
    }
}

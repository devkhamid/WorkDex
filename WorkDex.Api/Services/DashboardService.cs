using Microsoft.EntityFrameworkCore;
using WorkDex.Api.Data;
using WorkDex.Api.DTOs.Dashboard;
using WorkDex.Api.Models;

namespace WorkDex.Api.Services;

public class DashboardService : IDashboardService
{
    private readonly AppDbContext _context;
    private readonly ICurrencyService _currencyService;

    public DashboardService(AppDbContext context, ICurrencyService currencyService)
    {
        _context = context;
        _currencyService = currencyService;
    }

    private async Task<List<Guid>> GetAccessibleProjectIdsAsync(Guid requestingUserId, UserRole requestingUserRole)
    {
        if (requestingUserRole == UserRole.SuperAdmin)
        {
            return await _context.Projects.Select(p => p.Id).ToListAsync();
        }

        if (requestingUserRole == UserRole.Admin)
        {
            var admin = await _context.Users.FindAsync(requestingUserId);
            var adminId = admin?.CompanyAdminId ?? requestingUserId;
            return await _context.Projects
                .Where(p => p.CreatedByUserId == requestingUserId ||
                            p.CreatedByUserId == adminId ||
                            p.CompanyAdminId == adminId ||
                            (p.CreatedByUser != null && p.CreatedByUser.CompanyAdminId == adminId))
                .Select(p => p.Id)
                .ToListAsync();
        }

        var user = await _context.Users.FindAsync(requestingUserId);
        var targetCompanyAdminId = user?.CompanyAdminId ?? requestingUserId;

        return await _context.Projects
            .Where(p => p.CreatedByUserId == requestingUserId ||
                        p.CompanyAdminId == targetCompanyAdminId ||
                        p.Members.Any(m => m.UserId == requestingUserId))
            .Select(p => p.Id)
            .ToListAsync();
    }

    public async Task<DashboardStatsDto> GetStatsAsync(Guid requestingUserId, UserRole requestingUserRole)
    {
        var accessibleIds = await GetAccessibleProjectIdsAsync(requestingUserId, requestingUserRole);
        var defaultRate = await _currencyService.GetUsdToUzsRateAsync();
        if (defaultRate <= 0) defaultRate = 12700m;

        var projects = await _context.Projects
            .Where(p => accessibleIds.Contains(p.Id))
            .Include(p => p.ExtraWorks)
            .Include(p => p.MaterialPurchases)
            .Include(p => p.WorkerPayments)
            .ToListAsync();

        var totalProjects = projects.Count;
        var activeProjects = projects.Count(p => p.Status == ProjectStatus.Planning || p.Status == ProjectStatus.InProgress);
        var completedProjects = projects.Count(p => p.Status == ProjectStatus.Completed);
        var onHoldProjects = projects.Count(p => p.Status == ProjectStatus.OnHold);

        var baseContractValue = projects.Sum(p => p.ContractAmount);
        var approvedExtraWorksValue = await _context.ExtraWorks
            .Where(ew => accessibleIds.Contains(ew.ProjectId) && ew.IsApprovedByCustomer)
            .SumAsync(ew => (decimal?)ew.CustomerAmount) ?? 0;
        var totalContractValue = baseContractValue + approvedExtraWorksValue;

        var totalRevenue = await _context.Payments
            .Where(p => accessibleIds.Contains(p.ProjectId))
            .SumAsync(p => (decimal?)p.Amount) ?? 0;
        var totalPendingReceivables = totalContractValue - totalRevenue;

        var allPurchases = await _context.MaterialPurchases
            .Where(mp => accessibleIds.Contains(mp.ProjectId))
            .ToListAsync();

        decimal totalMaterialExpensesUsd = 0;
        decimal totalMaterialExpensesUzs = 0;
        foreach (var mp in allPurchases)
        {
            var mpRate = mp.ExchangeRateToUzs.HasValue && mp.ExchangeRateToUzs > 0 ? mp.ExchangeRateToUzs.Value : defaultRate;
            totalMaterialExpensesUzs += mp.TotalCost;
            if (mp.Currency == "USD" && mp.OriginalUnitPrice.HasValue && mp.OriginalUnitPrice > 0)
                totalMaterialExpensesUsd += Math.Round(mp.Quantity * mp.OriginalUnitPrice.Value, 2);
            else
                totalMaterialExpensesUsd += mpRate > 0 ? Math.Round(mp.TotalCost / mpRate, 2) : mp.TotalCost;
        }

        var allExpenses = await _context.Expenses
            .Where(e => e.ProjectId != null && accessibleIds.Contains(e.ProjectId.Value))
            .ToListAsync();

        decimal totalLaborExpensesUsd = 0;
        decimal totalLaborExpensesUzs = 0;
        decimal totalOtherExpensesUsd = 0;
        decimal totalOtherExpensesUzs = 0;

        foreach (var e in allExpenses)
        {
            var eRate = e.ExchangeRateToUzs.HasValue && e.ExchangeRateToUzs > 0 ? e.ExchangeRateToUzs.Value : defaultRate;
            decimal uzs = e.Amount;
            decimal usd = (e.Currency == "USD" && e.OriginalAmount.HasValue && e.OriginalAmount > 0)
                ? e.OriginalAmount.Value
                : (eRate > 0 ? Math.Round(e.Amount / eRate, 2) : e.Amount);

            if (e.Category == ExpenseCategory.Material)
            {
                totalMaterialExpensesUzs += uzs;
                totalMaterialExpensesUsd += usd;
            }
            else if (e.Category == ExpenseCategory.Labor)
            {
                totalLaborExpensesUzs += uzs;
                totalLaborExpensesUsd += usd;
            }
            else
            {
                totalOtherExpensesUzs += uzs;
                totalOtherExpensesUsd += usd;
            }
        }

        var allWorkerPayments = await _context.WorkerPayments
            .Where(wp => accessibleIds.Contains(wp.ProjectId))
            .ToListAsync();

        foreach (var wp in allWorkerPayments)
        {
            var wpRate = wp.ExchangeRateToUzs.HasValue && wp.ExchangeRateToUzs > 0 ? wp.ExchangeRateToUzs.Value : defaultRate;
            totalLaborExpensesUzs += wp.PaidAmount;
            totalLaborExpensesUsd += wpRate > 0 ? Math.Round(wp.PaidAmount / wpRate, 2) : wp.PaidAmount;
        }

        var allExtraWorks = await _context.ExtraWorks
            .Where(ew => accessibleIds.Contains(ew.ProjectId) && ew.IsApprovedByCustomer)
            .ToListAsync();
        decimal totalExtraWorkCostUsd = allExtraWorks.Sum(ew => ew.ActualCost);
        decimal totalExtraWorkCostUzs = Math.Round(totalExtraWorkCostUsd * defaultRate, 2);

        var totalExpensesUsd = totalMaterialExpensesUsd + totalLaborExpensesUsd + totalOtherExpensesUsd + totalExtraWorkCostUsd;
        var totalExpensesUzs = totalMaterialExpensesUzs + totalLaborExpensesUzs + totalOtherExpensesUzs + totalExtraWorkCostUzs;

        var totalNetProfitUsd = totalContractValue - totalExpensesUsd;
        var totalNetProfitUzs = (totalContractValue * defaultRate) - totalExpensesUzs;

        var netBalanceUsd = totalRevenue - totalExpensesUsd;
        var netBalanceUzs = (totalRevenue * defaultRate) - totalExpensesUzs;

        var atRiskCount = 0;
        decimal totalBudgetUtilization = 0;

        foreach (var p in projects)
        {
            decimal pExpUsd = 0;
            if (p.MaterialPurchases != null)
            {
                foreach (var mp in p.MaterialPurchases)
                {
                    var mpRate = mp.ExchangeRateToUzs.HasValue && mp.ExchangeRateToUzs > 0 ? mp.ExchangeRateToUzs.Value : defaultRate;
                    pExpUsd += (mp.Currency == "USD" && mp.OriginalUnitPrice.HasValue && mp.OriginalUnitPrice > 0)
                        ? Math.Round(mp.Quantity * mp.OriginalUnitPrice.Value, 2)
                        : (mpRate > 0 ? Math.Round(mp.TotalCost / mpRate, 2) : mp.TotalCost);
                }
            }
            if (p.WorkerPayments != null)
            {
                foreach (var wp in p.WorkerPayments)
                {
                    var wpRate = wp.ExchangeRateToUzs.HasValue && wp.ExchangeRateToUzs > 0 ? wp.ExchangeRateToUzs.Value : defaultRate;
                    pExpUsd += wpRate > 0 ? Math.Round(wp.PaidAmount / wpRate, 2) : wp.PaidAmount;
                }
            }
            var pDirectExpenses = allExpenses.Where(e => e.ProjectId == p.Id);
            foreach (var e in pDirectExpenses)
            {
                var eRate = e.ExchangeRateToUzs.HasValue && e.ExchangeRateToUzs > 0 ? e.ExchangeRateToUzs.Value : defaultRate;
                pExpUsd += (e.Currency == "USD" && e.OriginalAmount.HasValue && e.OriginalAmount > 0)
                    ? e.OriginalAmount.Value
                    : (eRate > 0 ? Math.Round(e.Amount / eRate, 2) : e.Amount);
            }
            pExpUsd += p.ExtraWorks?.Where(ew => ew.IsApprovedByCustomer).Sum(ew => ew.ActualCost) ?? 0;

            if (p.Budget > 0)
            {
                var util = pExpUsd / p.Budget * 100;
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
            TotalExpenses = totalExpensesUsd,
            TotalNetProfit = totalNetProfitUsd,
            NetBalance = netBalanceUsd,

            TotalContractValueUzs = Math.Round(totalContractValue * defaultRate, 2),
            TotalRevenueReceivedUzs = Math.Round(totalRevenue * defaultRate, 2),
            TotalPendingReceivablesUzs = Math.Round(totalPendingReceivables * defaultRate, 2),
            TotalExpensesUzs = totalExpensesUzs,
            TotalNetProfitUzs = totalNetProfitUzs,
            NetBalanceUzs = netBalanceUzs,

            AverageBudgetUtilizationPercent = avgUtilization,
            AtRiskProjectsCount = atRiskCount
        };
    }

    public async Task<List<ProjectStatusDistributionDto>> GetStatusDistributionAsync(Guid requestingUserId, UserRole requestingUserRole)
    {
        var accessibleIds = await GetAccessibleProjectIdsAsync(requestingUserId, requestingUserRole);

        var groups = await _context.Projects
            .Where(p => accessibleIds.Contains(p.Id))
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

    public async Task<List<DashboardRecentActivityDto>> GetRecentActivitiesAsync(Guid requestingUserId, UserRole requestingUserRole, int limit = 10)
    {
        var accessibleIds = await GetAccessibleProjectIdsAsync(requestingUserId, requestingUserRole);
        var defaultRate = await Money.CurrentRateAsync(_currencyService);
        decimal RateOf(decimal? r) => r is > 0 ? r.Value : defaultRate;

        var payments = (await _context.Payments
            .Where(p => accessibleIds.Contains(p.ProjectId))
            .OrderByDescending(p => p.CreatedAt)
            .Take(limit)
            .Select(p => new { p.PaymentMethod, ProjectName = p.Project.Name, p.Amount, p.ExchangeRate, p.Currency, p.OriginalAmount, CreatedByName = p.ReceivedByUser.FullName, p.CreatedAt })
            .ToListAsync())
            .Select(p => new DashboardRecentActivityDto
            {
                ActivityType = "Payment",
                Title = $"Mijoz to'lovi qabul qilindi ({p.PaymentMethod})",
                ProjectName = p.ProjectName,
                Amount = p.Amount,
                AmountUzs = p.Currency == "UZS" && p.OriginalAmount.HasValue ? p.OriginalAmount.Value : Math.Round(p.Amount * RateOf(p.ExchangeRate), 2),
                CreatedByName = p.CreatedByName,
                CreatedAt = p.CreatedAt
            });

        var expenses = (await _context.Expenses
            .Where(e => e.ProjectId != null && accessibleIds.Contains(e.ProjectId.Value))
            .OrderByDescending(e => e.CreatedAt)
            .Take(limit)
            .Select(e => new { e.Category, e.Description, ProjectName = e.Project != null ? e.Project.Name : "Ofis", e.Amount, e.ExchangeRateToUzs, CreatedByName = e.CreatedByUser.FullName, e.CreatedAt })
            .ToListAsync())
            .Select(e => new DashboardRecentActivityDto
            {
                ActivityType = "Expense",
                Title = $"{e.Category} xarajati: {e.Description}",
                ProjectName = e.ProjectName,
                Amount = Math.Round(e.Amount / RateOf(e.ExchangeRateToUzs), 2),
                AmountUzs = e.Amount,
                CreatedByName = e.CreatedByName,
                CreatedAt = e.CreatedAt
            });

        var materials = (await _context.MaterialPurchases
            .Where(mp => accessibleIds.Contains(mp.ProjectId))
            .OrderByDescending(mp => mp.CreatedAt)
            .Take(limit)
            .Select(mp => new { MaterialName = mp.Material.Name, mp.Quantity, mp.Unit, ProjectName = mp.Project.Name, mp.TotalCost, mp.ExchangeRateToUzs, CreatedByName = mp.CreatedByUser.FullName, mp.CreatedAt })
            .ToListAsync())
            .Select(mp => new DashboardRecentActivityDto
            {
                ActivityType = "MaterialPurchase",
                Title = $"Material xaridi: {mp.MaterialName} ({mp.Quantity} {mp.Unit})",
                ProjectName = mp.ProjectName,
                Amount = Math.Round(mp.TotalCost / RateOf(mp.ExchangeRateToUzs), 2),
                AmountUzs = mp.TotalCost,
                CreatedByName = mp.CreatedByName,
                CreatedAt = mp.CreatedAt
            });

        return payments.Concat(expenses).Concat(materials)
            .OrderByDescending(a => a.CreatedAt)
            .Take(limit)
            .ToList();
    }
}

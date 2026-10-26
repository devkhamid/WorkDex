using Microsoft.EntityFrameworkCore;
using WorkDex.Api.Data;
using WorkDex.Api.DTOs.ExtraWorks;
using WorkDex.Api.Models;

namespace WorkDex.Api.Services;

public class ExtraWorkService : IExtraWorkService
{
    private readonly AppDbContext _context;
    private readonly ICurrencyService _currencyService;

    public ExtraWorkService(AppDbContext context, ICurrencyService currencyService)
    {
        _context = context;
        _currencyService = currencyService;
    }

    private async Task ApplyAmountsAsync(ExtraWork ew, string? currencyInput, decimal customerAmount, decimal actualCost)
    {
        var currency = Money.Normalize(currencyInput, "USD");
        var rate = await Money.CurrentRateAsync(_currencyService);
        ew.Currency = currency;
        ew.ExchangeRate = rate;
        ew.OriginalCustomerAmount = customerAmount;
        ew.OriginalActualCost = actualCost;
        ew.CustomerAmount = Money.ToUsd(customerAmount, currency, rate);
        ew.ActualCost = Money.ToUsd(actualCost, currency, rate);
    }

    public async Task<ExtraWorkDto> AddExtraWorkAsync(Guid projectId, CreateExtraWorkDto dto, Guid createdByUserId)
    {
        var project = await _context.Projects.FindAsync(projectId);
        if (project is null)
            throw new KeyNotFoundException("Loyiha topilmadi.");

        var user = await _context.Users.FindAsync(createdByUserId);
        if (user is null)
            throw new KeyNotFoundException("Foydalanuvchi topilmadi.");

        var extraWork = new ExtraWork
        {
            ProjectId = projectId,
            Title = dto.Title.Trim(),
            Description = dto.Description?.Trim(),
            IsApprovedByCustomer = dto.IsApprovedByCustomer,
            ApprovedAt = dto.IsApprovedByCustomer ? DateTime.UtcNow : null,
            Notes = dto.Notes?.Trim(),
            CreatedByUserId = createdByUserId,
            CreatedAt = DateTime.UtcNow
        };
        await ApplyAmountsAsync(extraWork, dto.Currency, dto.CustomerAmount, dto.ActualCost);

        _context.ExtraWorks.Add(extraWork);
        await _context.SaveChangesAsync();

        return MapToDto(extraWork, user.FullName, extraWork.ExchangeRate!.Value);
    }

    public async Task<List<ExtraWorkDto>> GetExtraWorksByProjectAsync(Guid projectId)
    {
        var projectExists = await _context.Projects.AnyAsync(p => p.Id == projectId);
        if (!projectExists)
            throw new KeyNotFoundException("Loyiha topilmadi.");

        var list = await _context.ExtraWorks
            .Include(ew => ew.CreatedByUser)
            .Where(ew => ew.ProjectId == projectId)
            .OrderByDescending(ew => ew.CreatedAt)
            .ToListAsync();

        var currentRate = await Money.CurrentRateAsync(_currencyService);
        return list.Select(ew => MapToDto(ew, ew.CreatedByUser?.FullName ?? "", currentRate)).ToList();
    }

    public async Task<ExtraWorkDto> GetExtraWorkByIdAsync(Guid projectId, Guid extraWorkId)
    {
        var extraWork = await _context.ExtraWorks
            .Include(ew => ew.CreatedByUser)
            .FirstOrDefaultAsync(ew => ew.Id == extraWorkId && ew.ProjectId == projectId);

        if (extraWork is null)
            throw new KeyNotFoundException("Qo'shimcha ish topilmadi.");

        return MapToDto(extraWork, extraWork.CreatedByUser?.FullName ?? "", await Money.CurrentRateAsync(_currencyService));
    }

    public async Task<ExtraWorkDto> UpdateExtraWorkAsync(Guid projectId, Guid extraWorkId, UpdateExtraWorkDto dto)
    {
        var extraWork = await _context.ExtraWorks
            .Include(ew => ew.CreatedByUser)
            .FirstOrDefaultAsync(ew => ew.Id == extraWorkId && ew.ProjectId == projectId);

        if (extraWork is null)
            throw new KeyNotFoundException("Qo'shimcha ish topilmadi.");

        extraWork.Title = dto.Title.Trim();
        extraWork.Description = dto.Description?.Trim();
        var newCurrency = Money.Normalize(dto.Currency, "USD");
        var amountsUnchanged = newCurrency == extraWork.Currency &&
            (extraWork.OriginalCustomerAmount ?? extraWork.CustomerAmount) == dto.CustomerAmount &&
            (extraWork.OriginalActualCost ?? extraWork.ActualCost) == dto.ActualCost;
        if (!amountsUnchanged)
            await ApplyAmountsAsync(extraWork, newCurrency, dto.CustomerAmount, dto.ActualCost);
        if (!extraWork.IsApprovedByCustomer && dto.IsApprovedByCustomer)
        {
            extraWork.ApprovedAt = DateTime.UtcNow;
        }
        else if (!dto.IsApprovedByCustomer)
        {
            extraWork.ApprovedAt = null;
        }
        extraWork.IsApprovedByCustomer = dto.IsApprovedByCustomer;
        extraWork.Notes = dto.Notes?.Trim();

        await _context.SaveChangesAsync();

        return MapToDto(extraWork, extraWork.CreatedByUser?.FullName ?? "", await Money.CurrentRateAsync(_currencyService));
    }

    public async Task<ExtraWorkDto> ToggleApprovalAsync(Guid projectId, Guid extraWorkId)
    {
        var extraWork = await _context.ExtraWorks
            .Include(ew => ew.CreatedByUser)
            .FirstOrDefaultAsync(ew => ew.Id == extraWorkId && ew.ProjectId == projectId);

        if (extraWork is null)
            throw new KeyNotFoundException("Qo'shimcha ish topilmadi.");

        extraWork.IsApprovedByCustomer = !extraWork.IsApprovedByCustomer;
        extraWork.ApprovedAt = extraWork.IsApprovedByCustomer ? DateTime.UtcNow : null;

        await _context.SaveChangesAsync();

        return MapToDto(extraWork, extraWork.CreatedByUser?.FullName ?? "", await Money.CurrentRateAsync(_currencyService));
    }

    public async Task DeleteExtraWorkAsync(Guid projectId, Guid extraWorkId)
    {
        var extraWork = await _context.ExtraWorks
            .FirstOrDefaultAsync(ew => ew.Id == extraWorkId && ew.ProjectId == projectId);

        if (extraWork is null)
            throw new KeyNotFoundException("Qo'shimcha ish topilmadi.");

        _context.ExtraWorks.Remove(extraWork);
        await _context.SaveChangesAsync();
    }

    private static ExtraWorkDto MapToDto(ExtraWork ew, string createdByName, decimal fallbackRate)
    {
        var rate = ew.ExchangeRate is > 0 ? ew.ExchangeRate.Value : fallbackRate;
        var isUzs = ew.Currency == "UZS";
        return new ExtraWorkDto
        {
            Id = ew.Id,
            ProjectId = ew.ProjectId,
            Title = ew.Title,
            Description = ew.Description,
            CustomerAmount = ew.CustomerAmount,
            ActualCost = ew.ActualCost,
            Currency = ew.Currency,
            ExchangeRate = ew.ExchangeRate,
            OriginalCustomerAmount = ew.OriginalCustomerAmount,
            OriginalActualCost = ew.OriginalActualCost,
            CustomerAmountUzs = isUzs && ew.OriginalCustomerAmount.HasValue ? ew.OriginalCustomerAmount.Value : Math.Round(ew.CustomerAmount * rate, 2),
            ActualCostUzs = isUzs && ew.OriginalActualCost.HasValue ? ew.OriginalActualCost.Value : Math.Round(ew.ActualCost * rate, 2),
            IsApprovedByCustomer = ew.IsApprovedByCustomer,
            ApprovedAt = ew.ApprovedAt,
            Notes = ew.Notes,
            CreatedByUserId = ew.CreatedByUserId,
            CreatedByName = createdByName,
            CreatedAt = ew.CreatedAt
        };
    }
}

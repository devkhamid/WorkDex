using Microsoft.EntityFrameworkCore;
using WorkDex.Api.Data;
using WorkDex.Api.DTOs.Expenses;
using WorkDex.Api.Models;

namespace WorkDex.Api.Services;

public class ExpenseService : IExpenseService
{
    private readonly AppDbContext _context;

    public ExpenseService(AppDbContext context)
    {
        _context = context;
    }

    public async Task<ExpenseDto> AddExpenseAsync(Guid projectId, CreateExpenseDto dto, Guid createdByUserId)
    {
        var project = await _context.Projects.FindAsync(projectId);
        if (project is null)
            throw new KeyNotFoundException("Loyiha topilmadi.");

        var user = await _context.Users.FindAsync(createdByUserId);
        if (user is null)
            throw new KeyNotFoundException("Foydalanuvchi topilmadi.");

        var isUsd = string.Equals(dto.Currency, "USD", StringComparison.OrdinalIgnoreCase) && dto.ExchangeRateToUzs.HasValue && dto.ExchangeRateToUzs.Value > 0;
        var originalAmount = dto.OriginalAmount ?? dto.Amount;
        var effectiveAmount = isUsd ? Math.Round(originalAmount * dto.ExchangeRateToUzs!.Value, 2) : dto.Amount;

        var expense = new Expense
        {
            ProjectId = projectId,
            Category = dto.Category,
            Frequency = dto.Frequency,
            Amount = effectiveAmount,
            Currency = isUsd ? "USD" : "UZS",
            ExchangeRateToUzs = isUsd ? dto.ExchangeRateToUzs : null,
            OriginalAmount = isUsd ? originalAmount : null,
            Description = dto.Description.Trim(),
            ExpenseDate = dto.ExpenseDate.ToUniversalTime(),
            Notes = dto.Notes?.Trim(),
            CompanyAdminId = project.CompanyAdminId,
            CreatedByUserId = createdByUserId,
            CreatedAt = DateTime.UtcNow
        };

        _context.Expenses.Add(expense);
        await _context.SaveChangesAsync();

        // Load CreatedByUser before mapping
        await _context.Entry(expense).Reference(e => e.CreatedByUser).LoadAsync();

        return MapToDto(expense);
    }

    public async Task<List<ExpenseDto>> GetExpensesByProjectAsync(Guid projectId, ExpenseCategory? category = null)
    {
        var projectExists = await _context.Projects.AnyAsync(p => p.Id == projectId);
        if (!projectExists)
            throw new KeyNotFoundException("Loyiha topilmadi.");

        var query = _context.Expenses
            .Include(e => e.CreatedByUser)
            .Where(e => e.ProjectId == projectId);

        if (category.HasValue)
        {
            query = query.Where(e => e.Category == category.Value);
        }

        var expenses = await query
            .OrderByDescending(e => e.ExpenseDate)
            .ToListAsync();

        return expenses.Select(MapToDto).ToList();
    }

    public async Task<ExpenseDto> GetExpenseByIdAsync(Guid projectId, Guid expenseId)
    {
        var expense = await _context.Expenses
            .Include(e => e.CreatedByUser)
            .FirstOrDefaultAsync(e => e.Id == expenseId && e.ProjectId == projectId);

        if (expense is null)
            throw new KeyNotFoundException("Xarajat topilmadi.");

        return MapToDto(expense);
    }

    public async Task DeleteExpenseAsync(Guid projectId, Guid expenseId)
    {
        var expense = await _context.Expenses
            .FirstOrDefaultAsync(e => e.Id == expenseId && e.ProjectId == projectId);

        if (expense is null)
            throw new KeyNotFoundException("Xarajat topilmadi.");

        _context.Expenses.Remove(expense);
        await _context.SaveChangesAsync();
    }

    public async Task<List<ExpenseDto>> GetOfficeExpensesAsync(Guid requestingUserId, UserRole requestingUserRole)
    {
        var companyAdminId = await ResolveOfficeCompanyAdminIdAsync(requestingUserId, requestingUserRole);

        var query = _context.Expenses
            .Include(e => e.CreatedByUser)
            .Where(e => e.ProjectId == null);

        if (companyAdminId != null)
            query = query.Where(e => e.CompanyAdminId == companyAdminId);

        var expenses = await query.OrderByDescending(e => e.ExpenseDate).ToListAsync();
        return expenses.Select(MapToDto).ToList();
    }

    // Ofis xarajatlari uchun tenantlik qoidasi. `null` — cheklov yo'q (faqat SuperAdmin).
    // GetOfficeExpensesAsync va DeleteOfficeExpenseAsync ayni shu metodni ishlatadi,
    // shuning uchun ro'yxatda ko'rinadigan yozuvlar to'plami va o'chirish mumkin bo'lgan
    // yozuvlar to'plami hech qachon bir-biridan ajralib ketmaydi.
    private async Task<Guid?> ResolveOfficeCompanyAdminIdAsync(Guid requestingUserId, UserRole requestingUserRole)
    {
        if (requestingUserRole == UserRole.SuperAdmin)
        {
            // SuperAdmin sees all office expenses
            return null;
        }

        if (requestingUserRole == UserRole.Admin)
        {
            return requestingUserId;
        }

        var user = await _context.Users.FindAsync(requestingUserId);
        return user?.CompanyAdminId ?? requestingUserId;
    }

    public async Task<ExpenseDto> CreateOfficeExpenseAsync(CreateExpenseDto dto, Guid createdByUserId)
    {
        var requestingUser = await _context.Users.FindAsync(createdByUserId);
        var companyAdminId = requestingUser?.Role == UserRole.Admin
            ? createdByUserId
            : (requestingUser?.CompanyAdminId ?? createdByUserId);

        var expense = new Expense
        {
            ProjectId = null,
            Category = dto.Category,
            Frequency = dto.Frequency,
            Amount = dto.Amount,
            Description = dto.Description.Trim(),
            ExpenseDate = dto.ExpenseDate.ToUniversalTime(),
            Notes = dto.Notes?.Trim(),
            CreatedByUserId = createdByUserId,
            CompanyAdminId = companyAdminId,
            CreatedAt = DateTime.UtcNow
        };

        _context.Expenses.Add(expense);
        await _context.SaveChangesAsync();

        return MapToDto(expense);
    }

    public async Task DeleteOfficeExpenseAsync(Guid expenseId, Guid requestingUserId, UserRole requestingUserRole)
    {
        var companyAdminId = await ResolveOfficeCompanyAdminIdAsync(requestingUserId, requestingUserRole);

        var query = _context.Expenses.Where(e => e.Id == expenseId && e.ProjectId == null);

        // SuperAdmin uchun companyAdminId `null` — cheklov qo'shilmaydi, ya'ni
        // mavjud xatti-harakat o'zgarmaydi. Qolgan rollar faqat o'z kompaniyasining
        // yozuvini o'chiradi; begona yozuv "topilmadi" (404) beradi.
        if (companyAdminId != null)
            query = query.Where(e => e.CompanyAdminId == companyAdminId);

        var expense = await query.FirstOrDefaultAsync();

        if (expense is null)
            throw new KeyNotFoundException("Xarajat topilmadi.");

        _context.Expenses.Remove(expense);
        await _context.SaveChangesAsync();
    }

    private static ExpenseDto MapToDto(Expense e)
    {
        return new ExpenseDto
        {
            Id = e.Id,
            ProjectId = e.ProjectId,
            Category = e.Category,
            CategoryName = e.Category.ToString(),
            Frequency = e.Frequency,
            FrequencyName = e.Frequency.ToString(),
            Amount = e.Amount,
            Currency = e.Currency ?? "UZS",
            ExchangeRateToUzs = e.ExchangeRateToUzs,
            OriginalAmount = e.OriginalAmount,
            Description = e.Description,
            ExpenseDate = e.ExpenseDate,
            Notes = e.Notes,
            CreatedByUserId = e.CreatedByUserId,
            CreatedByName = e.CreatedByUser?.FullName ?? "",
            CreatedAt = e.CreatedAt
        };
    }
}

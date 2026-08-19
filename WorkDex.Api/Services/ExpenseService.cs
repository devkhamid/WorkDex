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

        var expense = new Expense
        {
            ProjectId = projectId,
            Category = dto.Category,
            Amount = dto.Amount,
            Description = dto.Description.Trim(),
            ExpenseDate = dto.ExpenseDate,
            Notes = dto.Notes?.Trim(),
            CreatedByUserId = createdByUserId,
            CreatedAt = DateTime.UtcNow
        };

        _context.Expenses.Add(expense);
        await _context.SaveChangesAsync();

        return new ExpenseDto
        {
            Id = expense.Id,
            ProjectId = expense.ProjectId,
            Category = expense.Category,
            CategoryName = expense.Category.ToString(),
            Amount = expense.Amount,
            Description = expense.Description,
            ExpenseDate = expense.ExpenseDate,
            Notes = expense.Notes,
            CreatedByUserId = expense.CreatedByUserId,
            CreatedByName = user.FullName,
            CreatedAt = expense.CreatedAt
        };
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

        return expenses.Select(e => new ExpenseDto
        {
            Id = e.Id,
            ProjectId = e.ProjectId,
            Category = e.Category,
            CategoryName = e.Category.ToString(),
            Amount = e.Amount,
            Description = e.Description,
            ExpenseDate = e.ExpenseDate,
            Notes = e.Notes,
            CreatedByUserId = e.CreatedByUserId,
            CreatedByName = e.CreatedByUser?.FullName ?? "",
            CreatedAt = e.CreatedAt
        }).ToList();
    }

    public async Task<ExpenseDto> GetExpenseByIdAsync(Guid projectId, Guid expenseId)
    {
        var expense = await _context.Expenses
            .Include(e => e.CreatedByUser)
            .FirstOrDefaultAsync(e => e.Id == expenseId && e.ProjectId == projectId);

        if (expense is null)
            throw new KeyNotFoundException("Xarajat topilmadi.");

        return new ExpenseDto
        {
            Id = expense.Id,
            ProjectId = expense.ProjectId,
            Category = expense.Category,
            CategoryName = expense.Category.ToString(),
            Amount = expense.Amount,
            Description = expense.Description,
            ExpenseDate = expense.ExpenseDate,
            Notes = expense.Notes,
            CreatedByUserId = expense.CreatedByUserId,
            CreatedByName = expense.CreatedByUser?.FullName ?? "",
            CreatedAt = expense.CreatedAt
        };
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
}

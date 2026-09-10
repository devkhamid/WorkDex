using WorkDex.Api.DTOs.Expenses;
using WorkDex.Api.Models;

namespace WorkDex.Api.Services;

public interface IExpenseService
{
    Task<ExpenseDto> AddExpenseAsync(Guid projectId, CreateExpenseDto dto, Guid createdByUserId);
    Task<List<ExpenseDto>> GetExpensesByProjectAsync(Guid projectId, ExpenseCategory? category = null);
    Task<ExpenseDto> GetExpenseByIdAsync(Guid projectId, Guid expenseId);
    Task DeleteExpenseAsync(Guid projectId, Guid expenseId);

    Task<List<ExpenseDto>> GetOfficeExpensesAsync(Guid requestingUserId, UserRole requestingUserRole);
    Task<ExpenseDto> CreateOfficeExpenseAsync(CreateExpenseDto dto, Guid createdByUserId);
    Task DeleteOfficeExpenseAsync(Guid expenseId, Guid requestingUserId, UserRole requestingUserRole);
}

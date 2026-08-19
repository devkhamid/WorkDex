using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using WorkDex.Api.DTOs.Expenses;
using WorkDex.Api.Helpers;
using WorkDex.Api.Models;
using WorkDex.Api.Services;

namespace WorkDex.Api.Controllers;

[ApiController]
[Route("api/projects/{projectId:guid}/expenses")]
[Authorize]
public class ExpensesController : ControllerBase
{
    private readonly IExpenseService _expenseService;

    public ExpensesController(IExpenseService expenseService)
    {
        _expenseService = expenseService;
    }

    [HttpGet]
    [Authorize(Roles = "Admin,Finance,ProjectManager,FieldWorker")]
    public async Task<IActionResult> GetExpenses(Guid projectId, [FromQuery] ExpenseCategory? category)
    {
        try
        {
            var expenses = await _expenseService.GetExpensesByProjectAsync(projectId, category);
            return Ok(expenses);
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
    }

    [HttpGet("{expenseId:guid}")]
    [Authorize(Roles = "Admin,Finance,ProjectManager,FieldWorker")]
    public async Task<IActionResult> GetExpenseById(Guid projectId, Guid expenseId)
    {
        try
        {
            var expense = await _expenseService.GetExpenseByIdAsync(projectId, expenseId);
            return Ok(expense);
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
    }

    [HttpPost]
    [Authorize(Roles = "Admin,Finance,ProjectManager")]
    public async Task<IActionResult> AddExpense(Guid projectId, [FromBody] CreateExpenseDto dto)
    {
        try
        {
            var userId = User.GetUserId();
            var expense = await _expenseService.AddExpenseAsync(projectId, dto, userId);
            return CreatedAtAction(nameof(GetExpenseById), new { projectId, expenseId = expense.Id }, expense);
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
    }

    [HttpDelete("{expenseId:guid}")]
    [Authorize(Roles = "Admin,Finance")]
    public async Task<IActionResult> DeleteExpense(Guid projectId, Guid expenseId)
    {
        try
        {
            await _expenseService.DeleteExpenseAsync(projectId, expenseId);
            return NoContent();
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
    }
}

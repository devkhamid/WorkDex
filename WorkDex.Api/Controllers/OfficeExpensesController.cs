using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using WorkDex.Api.Helpers;
using WorkDex.Api.Services;
using WorkDex.Api.DTOs.Expenses;

namespace WorkDex.Api.Controllers;

[ApiController]
[Route("api/office-expenses")]
[Authorize(Roles = "SuperAdmin,Admin,Finance")]
public class OfficeExpensesController : ControllerBase
{
    private readonly IExpenseService _expenseService;

    public OfficeExpensesController(IExpenseService expenseService)
    {
        _expenseService = expenseService;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var expenses = await _expenseService.GetOfficeExpensesAsync(User.GetUserId(), User.GetUserRole());
        return Ok(expenses);
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateExpenseDto dto)
    {
        try
        {
            var expense = await _expenseService.CreateOfficeExpenseAsync(dto, User.GetUserId());
            return Ok(expense);
        }
        catch (Exception ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id)
    {
        try
        {
            await _expenseService.DeleteOfficeExpenseAsync(id, User.GetUserId(), User.GetUserRole());
            return NoContent();
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
    }
}

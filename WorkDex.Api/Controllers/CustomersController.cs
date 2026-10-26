using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using WorkDex.Api.DTOs.Customers;
using WorkDex.Api.Helpers;
using WorkDex.Api.Models;
using WorkDex.Api.Services;

namespace WorkDex.Api.Controllers;

[ApiController]
[Route("api/customers")]
[Authorize]
public class CustomersController : ControllerBase
{
    private readonly ICustomerService _customerService;

    public CustomersController(ICustomerService customerService)
    {
        _customerService = customerService;
    }

    [HttpGet]
    [Authorize(Roles = "SuperAdmin,Admin,ProjectManager,Finance")]
    public async Task<IActionResult> GetAll()
    {
        var customers = await _customerService.GetAllAsync(User.GetUserId(), User.GetUserRole());
        return Ok(customers);
    }

    [HttpGet("{id:guid}")]
    [Authorize(Roles = "SuperAdmin,Admin,ProjectManager,Finance")]
    public async Task<IActionResult> GetById(Guid id)
    {
        try
        {
            var customer = await _customerService.GetByIdAsync(id, User.GetUserId(), User.GetUserRole());
            return Ok(customer);
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
    }

    [HttpPost]
    [Authorize(Roles = "SuperAdmin,Admin,ProjectManager")]
    public async Task<IActionResult> Create([FromBody] CreateCustomerDto dto)
    {
        var customer = await _customerService.CreateAsync(dto, User.GetUserId());

        return CreatedAtAction(nameof(GetById), new { id = customer.Id }, customer);
    }

    [HttpPut("{id:guid}")]
    [Authorize(Roles = "Admin,ProjectManager")]
    public async Task<IActionResult> Update(Guid id, [FromBody] UpdateCustomerDto dto)
    {
        try
        {
            var customer = await _customerService.UpdateAsync(id, dto, User.GetUserId(), User.GetUserRole());
            return Ok(customer);
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
    }

    [HttpDelete("{id:guid}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Delete(Guid id)
    {
        try
        {
            await _customerService.DeleteAsync(id, User.GetUserId(), User.GetUserRole());
            return NoContent();        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
        catch (InvalidOperationException ex)
        {
            return Conflict(new { message = ex.Message });        }
    }
}

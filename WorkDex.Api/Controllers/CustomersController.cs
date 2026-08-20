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

    // SuperAdmin, Admin, ProjectManager va Finance mijozlarni ko'ra oladi
    [HttpGet]
    [Authorize(Roles = "SuperAdmin,Admin,ProjectManager,Finance")]
    public async Task<IActionResult> GetAll()
    {
        var customers = await _customerService.GetAllAsync(User.GetUserId(), User.GetUserRole());
        return Ok(customers);
    }

    // SuperAdmin, Admin, ProjectManager va Finance bitta mijozni ko'ra oladi
    [HttpGet("{id:guid}")]
    [Authorize(Roles = "SuperAdmin,Admin,ProjectManager,Finance")]
    public async Task<IActionResult> GetById(Guid id)
    {
        try
        {
            var customer = await _customerService.GetByIdAsync(id);
            return Ok(customer);
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
    }

    // Admin va ProjectManager yangi mijoz yarata oladi
    [HttpPost]
    [Authorize(Roles = "SuperAdmin,Admin,ProjectManager")]
    public async Task<IActionResult> Create([FromBody] CreateCustomerDto dto)
    {
        var customer = await _customerService.CreateAsync(dto, User.GetUserId());

        // 201 Created — yangi yaratilgan resursning URL i bilan
        return CreatedAtAction(nameof(GetById), new { id = customer.Id }, customer);
    }

    // Admin va ProjectManager mijozni tahrirlaydi
    [HttpPut("{id:guid}")]
    [Authorize(Roles = "Admin,ProjectManager")]
    public async Task<IActionResult> Update(Guid id, [FromBody] UpdateCustomerDto dto)
    {
        try
        {
            var customer = await _customerService.UpdateAsync(id, dto);
            return Ok(customer);
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
    }

    // Faqat Admin o'chira oladi va faqat loyihasi bo'lmasa
    [HttpDelete("{id:guid}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Delete(Guid id)
    {
        try
        {
            await _customerService.DeleteAsync(id);
            return NoContent(); // 204 — muvaffaqiyatli o'chirildi
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
        catch (InvalidOperationException ex)
        {
            return Conflict(new { message = ex.Message }); // 409 — loyiha bor
        }
    }
}

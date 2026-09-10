using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using WorkDex.Api.DTOs.Agreements;
using WorkDex.Api.Helpers;
using WorkDex.Api.Models;
using WorkDex.Api.Services;

namespace WorkDex.Api.Controllers;

[ApiController]
[Route("api/agreements")]
[Authorize]
public class AgreementsController : ControllerBase
{
    private readonly IAgreementService _agreementService;

    public AgreementsController(IAgreementService agreementService)
    {
        _agreementService = agreementService;
    }

    [HttpGet]
    [Authorize(Roles = "SuperAdmin,Admin,Finance,ProjectManager")]
    public async Task<IActionResult> GetAll()
    {
        var list = await _agreementService.GetAllAsync(User.GetUserId(), User.GetUserRole());
        return Ok(list);
    }

    [HttpGet("{id:guid}")]
    [Authorize(Roles = "SuperAdmin,Admin,Finance,ProjectManager")]
    public async Task<IActionResult> GetById(Guid id)
    {
        var a = await _agreementService.GetByIdAsync(id);
        if (a == null) return NotFound();
        return Ok(a);
    }

    [HttpGet("next-number")]
    [Authorize(Roles = "SuperAdmin,Admin,Finance,ProjectManager")]
    public async Task<IActionResult> GetNextNumber()
    {
        var userId = User.GetUserId();
        var role = User.GetUserRole();
        Guid? companyAdminId = null;
        if (role == UserRole.Admin) companyAdminId = userId;
        var num = await _agreementService.GetNextContractNumberAsync(companyAdminId);
        return Ok(new { nextNumber = num });
    }

    [HttpPost]
    [Authorize(Roles = "SuperAdmin,Admin,Finance,ProjectManager")]
    public async Task<IActionResult> Create([FromBody] CreateAgreementDto dto)
    {
        var result = await _agreementService.CreateAsync(dto, User.GetUserId(), User.GetUserRole());
        return CreatedAtAction(nameof(GetById), new { id = result.Id }, result);
    }

    [HttpPut("{id:guid}")]
    [Authorize(Roles = "SuperAdmin,Admin,Finance,ProjectManager")]
    public async Task<IActionResult> Update(Guid id, [FromBody] UpdateAgreementDto dto)
    {
        try
        {
            var result = await _agreementService.UpdateAsync(id, dto);
            return Ok(result);
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
    }

    [HttpPost("{id:guid}/finalize")]
    [Authorize(Roles = "SuperAdmin,Admin")]
    public async Task<IActionResult> Finalize(Guid id, [FromBody] FinalizeAgreementDto dto)
    {
        try
        {
            var result = await _agreementService.FinalizeAsync(id, dto, User.GetUserId());
            return Ok(result);
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
    }

    [HttpDelete("{id:guid}")]
    [Authorize(Roles = "SuperAdmin,Admin")]
    public async Task<IActionResult> Delete(Guid id)
    {
        try
        {
            await _agreementService.DeleteAsync(id);
            return NoContent();
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
    }
}

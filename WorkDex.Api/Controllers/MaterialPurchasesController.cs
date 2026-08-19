using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using WorkDex.Api.DTOs.Materials;
using WorkDex.Api.Helpers;
using WorkDex.Api.Services;

namespace WorkDex.Api.Controllers;

[ApiController]
[Authorize]
public class MaterialPurchasesController : ControllerBase
{
    private readonly IMaterialService _materialService;

    public MaterialPurchasesController(IMaterialService materialService)
    {
        _materialService = materialService;
    }

    [HttpGet("api/projects/{projectId:guid}/material-purchases")]
    [Authorize(Roles = "Admin,Finance,ProjectManager,FieldWorker")]
    public async Task<IActionResult> GetPurchases(Guid projectId)
    {
        try
        {
            var purchases = await _materialService.GetPurchasesByProjectAsync(projectId);
            return Ok(purchases);
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
    }

    [HttpGet("api/projects/{projectId:guid}/material-purchases/{purchaseId:guid}")]
    [Authorize(Roles = "Admin,Finance,ProjectManager,FieldWorker")]
    public async Task<IActionResult> GetPurchaseById(Guid projectId, Guid purchaseId)
    {
        try
        {
            var purchase = await _materialService.GetPurchaseByIdAsync(projectId, purchaseId);
            return Ok(purchase);
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
    }

    [HttpPost("api/projects/{projectId:guid}/material-purchases")]
    [Authorize(Roles = "Admin,Finance,ProjectManager")]
    public async Task<IActionResult> AddPurchase(Guid projectId, [FromBody] CreateMaterialPurchaseDto dto)
    {
        try
        {
            var userId = User.GetUserId();
            var purchase = await _materialService.AddPurchaseAsync(projectId, dto, userId);
            return CreatedAtAction(nameof(GetPurchaseById), new { projectId, purchaseId = purchase.Id }, purchase);
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
    }

    [HttpDelete("api/projects/{projectId:guid}/material-purchases/{purchaseId:guid}")]
    [Authorize(Roles = "Admin,Finance")]
    public async Task<IActionResult> DeletePurchase(Guid projectId, Guid purchaseId)
    {
        try
        {
            await _materialService.DeletePurchaseAsync(projectId, purchaseId);
            return NoContent();
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
    }

    // PDF §5 — Qaysi materialdan qancha olingani va qancha sarflangani xulosasi
    [HttpGet("api/projects/{projectId:guid}/materials-summary")]
    [Authorize(Roles = "Admin,Finance,ProjectManager")]
    public async Task<IActionResult> GetMaterialSummary(Guid projectId)
    {
        try
        {
            var summary = await _materialService.GetProjectMaterialSummaryAsync(projectId);
            return Ok(summary);
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
    }
}

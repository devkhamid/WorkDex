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
    [Authorize(Roles = "SuperAdmin,Admin,Finance,ProjectManager,FieldWorker")]
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
    [Authorize(Roles = "SuperAdmin,Admin,Finance,ProjectManager,FieldWorker")]
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
    [Authorize(Roles = "SuperAdmin,Admin,Finance,ProjectManager")]
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
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpGet("api/projects/{projectId:guid}/material-purchases/import/template")]
    [Authorize(Roles = "SuperAdmin,Admin,Finance,ProjectManager")]
    public async Task<IActionResult> DownloadImportTemplate(Guid projectId)
    {
        try
        {
            var bytes = await _materialService.BuildPurchaseImportTemplateAsync(projectId, User.GetUserId());
            return File(bytes, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", "WorkDex_Xarid_Shablon.xlsx");
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
    }

    [HttpPost("api/projects/{projectId:guid}/material-purchases/import")]
    [Authorize(Roles = "SuperAdmin,Admin,Finance,ProjectManager")]
    [Consumes("multipart/form-data")]
    [RequestSizeLimit(10 * 1024 * 1024)]
    public async Task<IActionResult> ImportPurchases(Guid projectId, [FromForm] ImportMaterialsDto dto, [FromQuery] bool dryRun = true, [FromQuery] DateTime? purchaseDate = null)
    {
        var file = dto.File;
        if (file is null || file.Length == 0)
            return BadRequest(new { message = "Fayl tanlanmagan." });
        if (!Path.GetExtension(file.FileName).Equals(".xlsx", StringComparison.OrdinalIgnoreCase))
            return BadRequest(new { message = "Faqat .xlsx formatidagi Excel fayl qabul qilinadi." });
        if (file.Length > 5 * 1024 * 1024)
            return BadRequest(new { message = "Fayl hajmi 5 MB dan oshmasligi kerak." });

        try
        {
            using var stream = new MemoryStream();
            await file.CopyToAsync(stream);
            stream.Position = 0;
            var result = await _materialService.ImportPurchasesAsync(projectId, stream, User.GetUserId(), dryRun, purchaseDate);
            return Ok(result);
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
    }

    [HttpGet("api/material-purchases/import/template")]
    [Authorize(Roles = "SuperAdmin,Admin,Finance,ProjectManager")]
    public async Task<IActionResult> DownloadMultiProjectImportTemplate([FromQuery] List<Guid>? projectIds = null)
    {
        try
        {
            var bytes = await _materialService.BuildMultiProjectPurchaseTemplateAsync(User.GetUserId(), projectIds);
            return File(bytes, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", "WorkDex_Loyihalar_Material_Shablon.xlsx");
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
    }

    [HttpPost("api/material-purchases/import")]
    [Authorize(Roles = "SuperAdmin,Admin,Finance,ProjectManager")]
    [Consumes("multipart/form-data")]
    [RequestSizeLimit(10 * 1024 * 1024)]
    public async Task<IActionResult> ImportMultiProjectPurchases([FromForm] ImportMaterialsDto dto, [FromQuery] bool dryRun = true, [FromQuery] DateTime? purchaseDate = null)
    {
        var file = dto.File;
        if (file is null || file.Length == 0)
            return BadRequest(new { message = "Fayl tanlanmagan." });
        if (!Path.GetExtension(file.FileName).Equals(".xlsx", StringComparison.OrdinalIgnoreCase))
            return BadRequest(new { message = "Faqat .xlsx formatidagi Excel fayl qabul qilinadi." });
        if (file.Length > 5 * 1024 * 1024)
            return BadRequest(new { message = "Fayl hajmi 5 MB dan oshmasligi kerak." });

        try
        {
            using var stream = new MemoryStream();
            await file.CopyToAsync(stream);
            stream.Position = 0;
            var result = await _materialService.ImportMultiProjectPurchasesAsync(stream, User.GetUserId(), dryRun, purchaseDate);
            return Ok(result);
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
    }

    [HttpPut("api/projects/{projectId:guid}/material-purchases/{purchaseId:guid}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> UpdatePurchase(Guid projectId, Guid purchaseId, [FromBody] UpdateMaterialPurchaseDto dto)
    {
        try
        {
            return Ok(await _materialService.UpdatePurchaseAsync(projectId, purchaseId, dto));
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpPost("api/projects/{projectId:guid}/material-purchases/bulk-delete")]
    [Authorize(Roles = "SuperAdmin,Admin,Finance")]
    public async Task<IActionResult> BulkDeletePurchases(Guid projectId, [FromBody] BulkDeletePurchasesDto dto)
    {
        try
        {
            var deleted = await _materialService.DeletePurchasesAsync(projectId, dto.Ids.Distinct().ToList());
            return Ok(new { deleted });
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
    }

    [HttpDelete("api/projects/{projectId:guid}/material-purchases/{purchaseId:guid}")]
    [Authorize(Roles = "SuperAdmin,Admin,Finance")]
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

    [HttpGet("api/projects/{projectId:guid}/materials-summary")]
    [Authorize(Roles = "SuperAdmin,Admin,Finance,ProjectManager")]
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

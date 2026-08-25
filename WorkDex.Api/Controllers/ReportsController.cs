using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using WorkDex.Api.Helpers;
using WorkDex.Api.Services;

namespace WorkDex.Api.Controllers;

[ApiController]
[Route("api/reports")]
[Authorize(Roles = "SuperAdmin,Admin,Finance,ProjectManager")]
public class ReportsController : ControllerBase
{
    private readonly IExcelExportService _excelService;

    public ReportsController(IExcelExportService excelService)
    {
        _excelService = excelService;
    }

    // PDF §16 — Muayyan bitta loyiha bo'yicha 9 varaqli Excel hisoboti
    [HttpGet("projects/{projectId:guid}/excel")]
    public async Task<IActionResult> ExportProjectExcel(Guid projectId)
    {
        try
        {
            var bytes = await _excelService.ExportProjectToExcelAsync(projectId, User.GetUserId(), User.GetUserRole());
            var fileName = $"WorkDex_Project_{projectId}_{DateTime.UtcNow:yyyyMMdd_HHmm}.xlsx";
            return File(bytes, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", fileName);
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
    }

    // PDF §16 — Barcha loyihalar konsolidatsiyalangan Excel hisoboti
    [HttpGet("all-projects/excel")]
    public async Task<IActionResult> ExportAllProjectsExcel()
    {
        var bytes = await _excelService.ExportAllProjectsToExcelAsync(User.GetUserId(), User.GetUserRole());
        var fileName = $"WorkDex_All_Projects_{DateTime.UtcNow:yyyyMMdd_HHmm}.xlsx";
        return File(bytes, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", fileName);
    }
}

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

    // Yillik to'liq moliyaviy tahlil: ofis + loyihalar, barcha tahlil varaqlari Excel formulalari bilan.
    [HttpGet("annual/excel")]
    public async Task<IActionResult> ExportAnnualExcel([FromQuery] int? year)
    {
        var y = year ?? DateTime.UtcNow.Year;
        if (y < 2000 || y > 2100)
            return BadRequest(new { message = "Yil noto'g'ri kiritilgan." });

        var bytes = await _excelService.ExportAnnualReportAsync(y, User.GetUserId(), User.GetUserRole());
        var fileName = $"WorkDex_Yillik_Hisobot_{y}.xlsx";
        return File(bytes, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", fileName);
    }

    // Ixtiyoriy sana oralig'i bo'yicha moliyaviy tahlil (yillik hisobot bilan bir xil tuzilma, formulalar sana bo'yicha).
    [HttpGet("range/excel")]
    public async Task<IActionResult> ExportRangeExcel([FromQuery] DateTime? from, [FromQuery] DateTime? to)
    {
        if (from is null || to is null)
            return BadRequest(new { message = "Boshlanish va tugash sanalarini kiriting." });

        var start = from.Value.Date;
        var end = to.Value.Date;
        if (start.Year < 2000 || end.Year > 2100)
            return BadRequest(new { message = "Sana noto'g'ri kiritilgan." });
        if (start > end)
            return BadRequest(new { message = "Boshlanish sanasi tugash sanasidan keyin bo'lishi mumkin emas." });
        if ((end.Year - start.Year) * 12 + end.Month - start.Month >= 120)
            return BadRequest(new { message = "Oraliq 10 yildan oshmasligi kerak." });

        var bytes = await _excelService.ExportRangeReportAsync(start, end, User.GetUserId(), User.GetUserRole());
        var fileName = $"WorkDex_Hisobot_{start:yyyy-MM-dd}_{end:yyyy-MM-dd}.xlsx";
        return File(bytes, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", fileName);
    }
}

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using WorkDex.Api.DTOs.Workers;
using WorkDex.Api.Helpers;
using WorkDex.Api.Services;

namespace WorkDex.Api.Controllers;

[ApiController]
[Authorize]
public class WorkerPaymentsController : ControllerBase
{
    private readonly IWorkerService _workerService;

    public WorkerPaymentsController(IWorkerService workerService)
    {
        _workerService = workerService;
    }

    [HttpGet("api/projects/{projectId:guid}/worker-payments")]
    [Authorize(Roles = "SuperAdmin,Admin,Finance,ProjectManager,FieldWorker")]
    public async Task<IActionResult> GetWorkerJobs(Guid projectId)
    {
        try
        {
            var jobs = await _workerService.GetWorkerJobsByProjectAsync(projectId);
            return Ok(jobs);
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
    }

    [HttpGet("api/projects/{projectId:guid}/worker-payments/{paymentId:guid}")]
    [Authorize(Roles = "SuperAdmin,Admin,Finance,ProjectManager,FieldWorker")]
    public async Task<IActionResult> GetWorkerJobById(Guid projectId, Guid paymentId)
    {
        try
        {
            var job = await _workerService.GetWorkerJobByIdAsync(projectId, paymentId);
            return Ok(job);
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
    }

    [HttpPost("api/projects/{projectId:guid}/worker-payments")]
    [Authorize(Roles = "SuperAdmin,Admin,Finance,ProjectManager")]
    public async Task<IActionResult> AddWorkerJob(Guid projectId, [FromBody] CreateWorkerPaymentDto dto)
    {
        try
        {
            var userId = User.GetUserId();
            var job = await _workerService.AddWorkerJobAsync(projectId, dto, userId);
            return CreatedAtAction(nameof(GetWorkerJobById), new { projectId, paymentId = job.Id }, job);
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

    [HttpPatch("api/projects/{projectId:guid}/worker-payments/{paymentId:guid}/work-amount")]
    [Authorize(Roles = "SuperAdmin,Admin,Finance,ProjectManager")]
    public async Task<IActionResult> UpdateWorkAmount(Guid projectId, Guid paymentId, [FromBody] UpdateWorkerWorkAmountDto dto)
    {
        try
        {
            var job = await _workerService.UpdateWorkAmountAsync(projectId, paymentId, dto);
            return Ok(job);
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

    [HttpPatch("api/projects/{projectId:guid}/worker-payments/{paymentId:guid}/pay")]
    [Authorize(Roles = "SuperAdmin,Admin,Finance")]
    public async Task<IActionResult> PayWorker(Guid projectId, Guid paymentId, [FromBody] PayWorkerDto dto)
    {
        try
        {
            var job = await _workerService.PayWorkerAsync(projectId, paymentId, dto);
            return Ok(job);
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

    [HttpPut("api/projects/{projectId:guid}/worker-payments/{paymentId:guid}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> UpdateWorkerJob(Guid projectId, Guid paymentId, [FromBody] UpdateWorkerJobDto dto)
    {
        try
        {
            return Ok(await _workerService.UpdateWorkerJobAsync(projectId, paymentId, dto));
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

    [HttpDelete("api/projects/{projectId:guid}/worker-payments/{paymentId:guid}")]
    [Authorize(Roles = "SuperAdmin,Admin")]
    public async Task<IActionResult> DeleteWorkerJob(Guid projectId, Guid paymentId)
    {
        try
        {
            await _workerService.DeleteWorkerJobAsync(projectId, paymentId);
            return NoContent();
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
    }

    [HttpGet("api/worker-jobs/import/template")]
    [Authorize(Roles = "SuperAdmin,Admin,Finance")]
    public async Task<IActionResult> DownloadJobImportTemplate()
    {
        try
        {
            var bytes = await _workerService.BuildJobImportTemplateAsync(User.GetUserId());
            return File(bytes, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", "WorkDex_Ishchilik_Shablon.xlsx");
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

    [HttpPost("api/worker-jobs/import")]
    [Authorize(Roles = "SuperAdmin,Admin,Finance")]
    [Consumes("multipart/form-data")]
    [RequestSizeLimit(10 * 1024 * 1024)]
    public async Task<IActionResult> ImportJobs(IFormFile? file, [FromQuery] bool dryRun = true, [FromQuery] DateTime? paymentDate = null)
    {
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
            var result = await _workerService.ImportJobsAsync(stream, User.GetUserId(), dryRun, paymentDate);
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

    [HttpGet("api/projects/{projectId:guid}/workers-summary")]
    [Authorize(Roles = "SuperAdmin,Admin,Finance,ProjectManager")]
    public async Task<IActionResult> GetWorkersSummary(Guid projectId)
    {
        try
        {
            var summary = await _workerService.GetProjectWorkersSummaryAsync(projectId);
            return Ok(summary);
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
    }
}

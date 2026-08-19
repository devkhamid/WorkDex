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
    [Authorize(Roles = "Admin,Finance,ProjectManager,FieldWorker")]
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
    [Authorize(Roles = "Admin,Finance,ProjectManager,FieldWorker")]
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
    [Authorize(Roles = "Admin,Finance,ProjectManager")]
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
    }

    // Bajarilgan ish haqi summasini yangilash (ish hajmi tasdiqlanganda)
    [HttpPatch("api/projects/{projectId:guid}/worker-payments/{paymentId:guid}/work-amount")]
    [Authorize(Roles = "Admin,Finance,ProjectManager")]
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
    }

    // Ustaga haq / avans to'lash
    [HttpPatch("api/projects/{projectId:guid}/worker-payments/{paymentId:guid}/pay")]
    [Authorize(Roles = "Admin,Finance")]
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
    }

    [HttpDelete("api/projects/{projectId:guid}/worker-payments/{paymentId:guid}")]
    [Authorize(Roles = "Admin")]
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

    // PDF §6 va §15 — Loyiha ustalari bo'yicha jami hakedis, to'langan va qolgan qarz xulosasi
    [HttpGet("api/projects/{projectId:guid}/workers-summary")]
    [Authorize(Roles = "Admin,Finance,ProjectManager")]
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

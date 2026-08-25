using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using WorkDex.Api.DTOs.Workers;
using WorkDex.Api.Helpers;
using WorkDex.Api.Models;
using WorkDex.Api.Services;

namespace WorkDex.Api.Controllers;

[ApiController]
[Route("api/workers")]
[Authorize]
public class WorkersController : ControllerBase
{
    private readonly IWorkerService _workerService;

    public WorkersController(IWorkerService workerService)
    {
        _workerService = workerService;
    }

    [HttpGet]
    [Authorize(Roles = "SuperAdmin,Admin,Finance,ProjectManager,FieldWorker")]
    public async Task<IActionResult> GetAll()
    {
        var workers = await _workerService.GetAllWorkersAsync(User.GetUserId(), User.GetUserRole());
        return Ok(workers);
    }

    [HttpGet("{id:guid}")]
    [Authorize(Roles = "SuperAdmin,Admin,Finance,ProjectManager,FieldWorker")]
    public async Task<IActionResult> GetById(Guid id)
    {
        try
        {
            var worker = await _workerService.GetWorkerByIdAsync(id, User.GetUserId(), User.GetUserRole());
            return Ok(worker);
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
    }

    [HttpPost]
    [Authorize(Roles = "SuperAdmin,Admin,ProjectManager,Finance")]
    public async Task<IActionResult> Create([FromBody] CreateWorkerDto dto)
    {
        var worker = await _workerService.CreateWorkerAsync(dto, User.GetUserId());
        return CreatedAtAction(nameof(GetById), new { id = worker.Id }, worker);
    }

    [HttpPut("{id:guid}")]
    [Authorize(Roles = "Admin,ProjectManager,Finance")]
    public async Task<IActionResult> Update(Guid id, [FromBody] CreateWorkerDto dto)
    {
        try
        {
            var worker = await _workerService.UpdateWorkerAsync(id, dto, User.GetUserId(), User.GetUserRole());
            return Ok(worker);
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
            await _workerService.DeleteWorkerAsync(id, User.GetUserId(), User.GetUserRole());
            return NoContent();
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
        catch (InvalidOperationException ex)
        {
            return Conflict(new { message = ex.Message });
        }
    }
}

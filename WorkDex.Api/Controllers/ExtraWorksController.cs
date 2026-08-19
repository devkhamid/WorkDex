using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using WorkDex.Api.DTOs.ExtraWorks;
using WorkDex.Api.Helpers;
using WorkDex.Api.Services;

namespace WorkDex.Api.Controllers;

[ApiController]
[Route("api/projects/{projectId:guid}/extra-works")]
[Authorize]
public class ExtraWorksController : ControllerBase
{
    private readonly IExtraWorkService _extraWorkService;

    public ExtraWorksController(IExtraWorkService extraWorkService)
    {
        _extraWorkService = extraWorkService;
    }

    [HttpGet]
    [Authorize(Roles = "Admin,Finance,ProjectManager,FieldWorker")]
    public async Task<IActionResult> GetExtraWorks(Guid projectId)
    {
        try
        {
            var list = await _extraWorkService.GetExtraWorksByProjectAsync(projectId);
            return Ok(list);
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
    }

    [HttpGet("{extraWorkId:guid}")]
    [Authorize(Roles = "Admin,Finance,ProjectManager,FieldWorker")]
    public async Task<IActionResult> GetExtraWorkById(Guid projectId, Guid extraWorkId)
    {
        try
        {
            var item = await _extraWorkService.GetExtraWorkByIdAsync(projectId, extraWorkId);
            return Ok(item);
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
    }

    [HttpPost]
    [Authorize(Roles = "Admin,ProjectManager")]
    public async Task<IActionResult> AddExtraWork(Guid projectId, [FromBody] CreateExtraWorkDto dto)
    {
        try
        {
            var userId = User.GetUserId();
            var item = await _extraWorkService.AddExtraWorkAsync(projectId, dto, userId);
            return CreatedAtAction(nameof(GetExtraWorkById), new { projectId, extraWorkId = item.Id }, item);
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
    }

    [HttpPut("{extraWorkId:guid}")]
    [Authorize(Roles = "Admin,ProjectManager")]
    public async Task<IActionResult> UpdateExtraWork(Guid projectId, Guid extraWorkId, [FromBody] UpdateExtraWorkDto dto)
    {
        try
        {
            var item = await _extraWorkService.UpdateExtraWorkAsync(projectId, extraWorkId, dto);
            return Ok(item);
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
    }

    [HttpPatch("{extraWorkId:guid}/toggle-approval")]
    [Authorize(Roles = "Admin,ProjectManager")]
    public async Task<IActionResult> ToggleApproval(Guid projectId, Guid extraWorkId)
    {
        try
        {
            var item = await _extraWorkService.ToggleApprovalAsync(projectId, extraWorkId);
            return Ok(item);
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
    }

    [HttpDelete("{extraWorkId:guid}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> DeleteExtraWork(Guid projectId, Guid extraWorkId)
    {
        try
        {
            await _extraWorkService.DeleteExtraWorkAsync(projectId, extraWorkId);
            return NoContent();
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
    }
}

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using WorkDex.Api.DTOs.Updates;
using WorkDex.Api.Helpers;
using WorkDex.Api.Services;

namespace WorkDex.Api.Controllers;

[ApiController]
[Route("api/projects/{projectId:guid}/updates")]
[Authorize]
public class ProjectUpdatesController : ControllerBase
{
    private readonly IProjectMediaService _mediaService;

    public ProjectUpdatesController(IProjectMediaService mediaService)
    {
        _mediaService = mediaService;
    }

    [HttpGet]
    [Authorize(Roles = "Admin,Finance,ProjectManager,FieldWorker,Customer")]
    public async Task<IActionResult> GetUpdates(Guid projectId, [FromQuery] bool onlyCustomerVisible = false)
    {
        try
        {
            var isCustomer = User.IsInRole("Customer");
            var updates = await _mediaService.GetUpdatesAsync(projectId, isCustomer || onlyCustomerVisible);
            return Ok(updates);
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
    }

    [HttpPost]
    [Authorize(Roles = "Admin,ProjectManager,FieldWorker")]
    public async Task<IActionResult> AddUpdate(Guid projectId, [FromBody] CreateProjectUpdateDto dto)
    {
        try
        {
            var userId = User.GetUserId();
            var update = await _mediaService.AddUpdateAsync(projectId, dto, userId);
            return Ok(update);
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
    }

    [HttpDelete("{updateId:guid}")]
    [Authorize(Roles = "Admin,ProjectManager")]
    public async Task<IActionResult> DeleteUpdate(Guid projectId, Guid updateId)
    {
        try
        {
            await _mediaService.DeleteUpdateAsync(projectId, updateId);
            return NoContent();
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
    }
}

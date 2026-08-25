using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using WorkDex.Api.DTOs.Projects;
using WorkDex.Api.Helpers;
using WorkDex.Api.Models;
using WorkDex.Api.Services;

namespace WorkDex.Api.Controllers;

[ApiController]
[Route("api/projects")]
[Authorize]
public class ProjectsController : ControllerBase
{
    private readonly IProjectService _projectService;
    private readonly IProjectAccessGuard _accessGuard;

    public ProjectsController(IProjectService projectService, IProjectAccessGuard accessGuard)
    {
        _projectService = projectService;
        _accessGuard = accessGuard;
    }

    /// <summary>
    /// Joriy foydalanuvchi shu loyihaga kirish huquqiga egaligini tekshiradi.
    /// Ruxsat bo'lmasa KeyNotFoundException tashlanadi va 404 qaytadi.
    /// </summary>
    private Task EnsureAccessAsync(Guid projectId) =>
        _accessGuard.EnsureCanAccessAsync(projectId, User.GetUserId(), User.GetUserRole());

    [HttpGet]
    [Authorize(Roles = "SuperAdmin,Admin,ProjectManager,Finance,FieldWorker")]
    public async Task<IActionResult> GetAll()
    {
        var userId = User.GetUserId();
        var role = User.GetUserRole();
        var projects = await _projectService.GetAllAsync(userId, role);
        return Ok(projects);
    }

    [HttpGet("{id:guid}")]
    [Authorize(Roles = "Admin,ProjectManager,Finance,FieldWorker")]
    public async Task<IActionResult> GetById(Guid id)
    {
        try
        {
            await EnsureAccessAsync(id);
            var project = await _projectService.GetByIdAsync(id);
            return Ok(project);
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
    }

    [HttpPost]
    [Authorize(Roles = "Admin,ProjectManager")]
    public async Task<IActionResult> Create([FromBody] CreateProjectDto dto)
    {
        try
        {
            var userId = User.GetUserId();
            var project = await _projectService.CreateAsync(dto, userId);
            return CreatedAtAction(nameof(GetById), new { id = project.Id }, project);
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
    }

    [HttpPut("{id:guid}")]
    [Authorize(Roles = "Admin,ProjectManager")]
    public async Task<IActionResult> Update(Guid id, [FromBody] UpdateProjectDto dto)
    {
        try
        {
            await EnsureAccessAsync(id);
            var project = await _projectService.UpdateAsync(id, dto);
            return Ok(project);
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
    }

    [HttpPatch("{id:guid}/status")]
    [Authorize(Roles = "Admin,ProjectManager")]
    public async Task<IActionResult> UpdateStatus(Guid id, [FromBody] UpdateProjectStatusDto dto)
    {
        try
        {
            await EnsureAccessAsync(id);
            var project = await _projectService.UpdateStatusAsync(id, dto);
            return Ok(project);
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
    }

    // Moliyaviy xulosa — PDF §4
    [HttpGet("{id:guid}/summary")]
    [Authorize(Roles = "Admin,Finance,ProjectManager")]
    public async Task<IActionResult> GetSummary(Guid id)
    {
        try
        {
            await EnsureAccessAsync(id);
            var summary = await _projectService.GetSummaryAsync(id);
            return Ok(summary);
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
    }

    // A'zolarni boshqarish
    [HttpGet("{id:guid}/members")]
    [Authorize(Roles = "Admin,ProjectManager")]
    public async Task<IActionResult> GetMembers(Guid id)
    {
        try
        {
            await EnsureAccessAsync(id);
            var members = await _projectService.GetMembersAsync(id);
            return Ok(members);
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
    }

    [HttpPost("{id:guid}/members")]
    [Authorize(Roles = "Admin,ProjectManager")]
    public async Task<IActionResult> AddMember(Guid id, [FromBody] AddProjectMemberDto dto)
    {
        try
        {
            await EnsureAccessAsync(id);
            var member = await _projectService.AddMemberAsync(id, dto);
            return Ok(member);
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

    [HttpDelete("{id:guid}/members/{userId:guid}")]
    [Authorize(Roles = "Admin,ProjectManager")]
    public async Task<IActionResult> RemoveMember(Guid id, Guid userId)
    {
        try
        {
            await EnsureAccessAsync(id);
            await _projectService.RemoveMemberAsync(id, userId);
            return NoContent();
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
    }

    // Bosqichlarni boshqarish — PDF §8
    [HttpGet("{id:guid}/stages")]
    [Authorize(Roles = "SuperAdmin,Admin,ProjectManager,Finance,FieldWorker,Customer")]
    public async Task<IActionResult> GetStages(Guid id)
    {
        try
        {
            await EnsureAccessAsync(id);
            var stages = await _projectService.GetStagesAsync(id);
            return Ok(stages);
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
    }

    [HttpPost("{id:guid}/stages")]
    [Authorize(Roles = "Admin,ProjectManager")]
    public async Task<IActionResult> AddStage(Guid id, [FromBody] CreateProjectStageDto dto)
    {
        try
        {
            await EnsureAccessAsync(id);
            var stage = await _projectService.AddStageAsync(id, dto);
            return Ok(stage);
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

    [HttpPatch("{id:guid}/stages/{stageId:guid}/complete")]
    [Authorize(Roles = "Admin,ProjectManager,FieldWorker")]
    public async Task<IActionResult> CompleteStage(Guid id, Guid stageId)
    {
        try
        {
            await EnsureAccessAsync(id);
            var stage = await _projectService.CompleteStageAsync(id, stageId);
            return Ok(stage);
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
    }

    [HttpDelete("{id:guid}/stages/{stageId:guid}")]
    [Authorize(Roles = "Admin,ProjectManager")]
    public async Task<IActionResult> DeleteStage(Guid id, Guid stageId)
    {
        try
        {
            await EnsureAccessAsync(id);
            await _projectService.DeleteStageAsync(id, stageId);
            return NoContent();
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
            await EnsureAccessAsync(id);
            await _projectService.DeleteAsync(id);
            return Ok(new { message = "Loyiha muvaffaqiyatli o'chirildi." });
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
    }
}

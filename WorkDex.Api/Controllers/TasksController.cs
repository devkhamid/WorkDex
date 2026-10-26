using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using WorkDex.Api.DTOs.Tasks;
using WorkDex.Api.Services;

namespace WorkDex.Api.Controllers;

[ApiController]
[Route("api/projects/{projectId:guid}/tasks")]
[Authorize]
public class TasksController : ControllerBase
{
    private readonly ITaskService _taskService;

    public TasksController(ITaskService taskService)
    {
        _taskService = taskService;
    }

    [HttpGet]
    [Authorize(Roles = "Admin,Finance,ProjectManager,FieldWorker")]
    public async Task<IActionResult> GetTasks(Guid projectId, [FromQuery] Guid? stageId)
    {
        try
        {
            var tasks = await _taskService.GetTasksByProjectAsync(projectId, stageId);
            return Ok(tasks);
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
    }

    [HttpGet("{taskId:guid}")]
    [Authorize(Roles = "Admin,Finance,ProjectManager,FieldWorker")]
    public async Task<IActionResult> GetTaskById(Guid projectId, Guid taskId)
    {
        try
        {
            var task = await _taskService.GetTaskByIdAsync(projectId, taskId);
            return Ok(task);
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
    }

    [HttpPost]
    [Authorize(Roles = "Admin,ProjectManager")]
    public async Task<IActionResult> CreateTask(Guid projectId, [FromBody] CreateTaskDto dto)
    {
        try
        {
            var task = await _taskService.CreateTaskAsync(projectId, dto);
            return CreatedAtAction(nameof(GetTaskById), new { projectId, taskId = task.Id }, task);
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
    }

    [HttpPut("{taskId:guid}")]
    [Authorize(Roles = "Admin,ProjectManager")]
    public async Task<IActionResult> UpdateTask(Guid projectId, Guid taskId, [FromBody] UpdateTaskDto dto)
    {
        try
        {
            var task = await _taskService.UpdateTaskAsync(projectId, taskId, dto);
            return Ok(task);
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
    }

    [HttpPatch("{taskId:guid}/toggle-complete")]
    [Authorize(Roles = "Admin,ProjectManager,FieldWorker")]
    public async Task<IActionResult> ToggleComplete(Guid projectId, Guid taskId)
    {
        try
        {
            var task = await _taskService.ToggleTaskCompleteAsync(projectId, taskId);
            return Ok(task);
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
    }

    [HttpDelete("{taskId:guid}")]
    [Authorize(Roles = "Admin,ProjectManager")]
    public async Task<IActionResult> DeleteTask(Guid projectId, Guid taskId)
    {
        try
        {
            await _taskService.DeleteTaskAsync(projectId, taskId);
            return NoContent();
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
    }
}

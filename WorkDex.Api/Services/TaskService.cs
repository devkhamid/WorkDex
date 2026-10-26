using Microsoft.EntityFrameworkCore;
using WorkDex.Api.Data;
using WorkDex.Api.DTOs.Tasks;
using WorkDex.Api.Models;

namespace WorkDex.Api.Services;

public class TaskService : ITaskService
{
    private readonly AppDbContext _context;

    public TaskService(AppDbContext context)
    {
        _context = context;
    }

    public async Task<TaskDto> CreateTaskAsync(Guid projectId, CreateTaskDto dto)
    {
        var project = await _context.Projects.FindAsync(projectId);
        if (project is null)
            throw new KeyNotFoundException("Loyiha topilmadi.");

        if (dto.StageId.HasValue)
        {
            var stageExists = await _context.ProjectStages
                .AnyAsync(s => s.Id == dto.StageId.Value && s.ProjectId == projectId);
            if (!stageExists)
                throw new KeyNotFoundException("Bosqich topilmadi.");
        }

        if (dto.AssignedToUserId.HasValue)
        {
            var userExists = await _context.Users.AnyAsync(u => u.Id == dto.AssignedToUserId.Value);
            if (!userExists)
                throw new KeyNotFoundException("Biriktirilgan foydalanuvchi topilmadi.");
        }

        var task = new ProjectTask
        {
            ProjectId = projectId,
            StageId = dto.StageId,
            Title = dto.Title.Trim(),
            Description = dto.Description?.Trim(),
            AssignedToUserId = dto.AssignedToUserId,
            Weight = dto.Weight > 0 ? dto.Weight : 1,
            IsCompleted = false,
            DueDate = dto.DueDate,
            CreatedAt = DateTime.UtcNow
        };

        _context.Tasks.Add(task);
        await _context.SaveChangesAsync();

        await RecalculateProjectProgressAsync(projectId);

        return await GetTaskByIdAsync(projectId, task.Id);
    }

    public async Task<List<TaskDto>> GetTasksByProjectAsync(Guid projectId, Guid? stageId = null)
    {
        var projectExists = await _context.Projects.AnyAsync(p => p.Id == projectId);
        if (!projectExists)
            throw new KeyNotFoundException("Loyiha topilmadi.");

        var query = _context.Tasks
            .Include(t => t.Stage)
            .Include(t => t.AssignedToUser)
            .Where(t => t.ProjectId == projectId);

        if (stageId.HasValue)
        {
            query = query.Where(t => t.StageId == stageId.Value);
        }

        var tasks = await query
            .OrderBy(t => t.IsCompleted)
            .ThenBy(t => t.DueDate)
            .ToListAsync();

        return tasks.Select(MapToDto).ToList();
    }

    public async Task<TaskDto> GetTaskByIdAsync(Guid projectId, Guid taskId)
    {
        var task = await _context.Tasks
            .Include(t => t.Stage)
            .Include(t => t.AssignedToUser)
            .FirstOrDefaultAsync(t => t.Id == taskId && t.ProjectId == projectId);

        if (task is null)
            throw new KeyNotFoundException("Vazifa topilmadi.");

        return MapToDto(task);
    }

    public async Task<TaskDto> UpdateTaskAsync(Guid projectId, Guid taskId, UpdateTaskDto dto)
    {
        var task = await _context.Tasks
            .Include(t => t.Stage)
            .Include(t => t.AssignedToUser)
            .FirstOrDefaultAsync(t => t.Id == taskId && t.ProjectId == projectId);

        if (task is null)
            throw new KeyNotFoundException("Vazifa topilmadi.");

        if (dto.StageId.HasValue && dto.StageId != task.StageId)
        {
            var stageExists = await _context.ProjectStages
                .AnyAsync(s => s.Id == dto.StageId.Value && s.ProjectId == projectId);
            if (!stageExists)
                throw new KeyNotFoundException("Bosqich topilmadi.");
        }

        if (dto.AssignedToUserId.HasValue && dto.AssignedToUserId != task.AssignedToUserId)
        {
            var userExists = await _context.Users.AnyAsync(u => u.Id == dto.AssignedToUserId.Value);
            if (!userExists)
                throw new KeyNotFoundException("Biriktirilgan foydalanuvchi topilmadi.");
        }

        task.Title = dto.Title.Trim();
        task.Description = dto.Description?.Trim();
        task.StageId = dto.StageId;
        task.AssignedToUserId = dto.AssignedToUserId;
        task.Weight = dto.Weight > 0 ? dto.Weight : 1;
        task.DueDate = dto.DueDate;

        if (!task.IsCompleted && dto.IsCompleted)
        {
            task.CompletedAt = DateTime.UtcNow;
        }
        else if (!dto.IsCompleted)
        {
            task.CompletedAt = null;
        }
        task.IsCompleted = dto.IsCompleted;

        await _context.SaveChangesAsync();
        await RecalculateProjectProgressAsync(projectId);

        return await GetTaskByIdAsync(projectId, task.Id);
    }

    public async Task<TaskDto> ToggleTaskCompleteAsync(Guid projectId, Guid taskId)
    {
        var task = await _context.Tasks
            .Include(t => t.Stage)
            .Include(t => t.AssignedToUser)
            .FirstOrDefaultAsync(t => t.Id == taskId && t.ProjectId == projectId);

        if (task is null)
            throw new KeyNotFoundException("Vazifa topilmadi.");

        task.IsCompleted = !task.IsCompleted;
        task.CompletedAt = task.IsCompleted ? DateTime.UtcNow : null;

        await _context.SaveChangesAsync();
        await RecalculateProjectProgressAsync(projectId);

        return await GetTaskByIdAsync(projectId, task.Id);
    }

    public async Task DeleteTaskAsync(Guid projectId, Guid taskId)
    {
        var task = await _context.Tasks
            .FirstOrDefaultAsync(t => t.Id == taskId && t.ProjectId == projectId);

        if (task is null)
            throw new KeyNotFoundException("Vazifa topilmadi.");

        _context.Tasks.Remove(task);
        await _context.SaveChangesAsync();

        await RecalculateProjectProgressAsync(projectId);
    }

    private async Task RecalculateProjectProgressAsync(Guid projectId)
    {
        var project = await _context.Projects.FindAsync(projectId);
        if (project is null) return;

        var tasks = await _context.Tasks
            .Where(t => t.ProjectId == projectId)
            .ToListAsync();

        if (!tasks.Any())
        {
            project.ProgressPercent = 0;
        }
        else
        {
            var totalWeight = tasks.Sum(t => t.Weight);
            var completedWeight = tasks.Where(t => t.IsCompleted).Sum(t => t.Weight);
            project.ProgressPercent = totalWeight > 0
                ? Math.Round((decimal)completedWeight / totalWeight * 100, 2)
                : 0;
        }

        project.UpdatedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync();
    }

    private static TaskDto MapToDto(ProjectTask t) => new()
    {
        Id = t.Id,
        ProjectId = t.ProjectId,
        StageId = t.StageId,
        StageName = t.Stage?.Name,
        Title = t.Title,
        Description = t.Description,
        AssignedToUserId = t.AssignedToUserId,
        AssignedToUserName = t.AssignedToUser?.FullName,
        Weight = t.Weight,
        IsCompleted = t.IsCompleted,
        CompletedAt = t.CompletedAt,
        DueDate = t.DueDate,
        CreatedAt = t.CreatedAt
    };
}

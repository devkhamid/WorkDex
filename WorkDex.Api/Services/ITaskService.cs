using WorkDex.Api.DTOs.Tasks;

namespace WorkDex.Api.Services;

public interface ITaskService
{
    Task<TaskDto> CreateTaskAsync(Guid projectId, CreateTaskDto dto);
    Task<List<TaskDto>> GetTasksByProjectAsync(Guid projectId, Guid? stageId = null);
    Task<TaskDto> GetTaskByIdAsync(Guid projectId, Guid taskId);
    Task<TaskDto> UpdateTaskAsync(Guid projectId, Guid taskId, UpdateTaskDto dto);
    Task<TaskDto> ToggleTaskCompleteAsync(Guid projectId, Guid taskId);
    Task DeleteTaskAsync(Guid projectId, Guid taskId);
}

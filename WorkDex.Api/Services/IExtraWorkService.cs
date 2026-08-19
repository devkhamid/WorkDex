using WorkDex.Api.DTOs.ExtraWorks;

namespace WorkDex.Api.Services;

public interface IExtraWorkService
{
    Task<ExtraWorkDto> AddExtraWorkAsync(Guid projectId, CreateExtraWorkDto dto, Guid createdByUserId);
    Task<List<ExtraWorkDto>> GetExtraWorksByProjectAsync(Guid projectId);
    Task<ExtraWorkDto> GetExtraWorkByIdAsync(Guid projectId, Guid extraWorkId);
    Task<ExtraWorkDto> UpdateExtraWorkAsync(Guid projectId, Guid extraWorkId, UpdateExtraWorkDto dto);
    Task<ExtraWorkDto> ToggleApprovalAsync(Guid projectId, Guid extraWorkId);
    Task DeleteExtraWorkAsync(Guid projectId, Guid extraWorkId);
}

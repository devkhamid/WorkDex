using WorkDex.Api.DTOs.Projects;
using WorkDex.Api.Models;

namespace WorkDex.Api.Services;

public interface IProjectService
{
    Task<List<ProjectDto>> GetAllAsync(Guid requestingUserId, UserRole requestingUserRole);
    Task<ProjectDto> GetByIdAsync(Guid id);
    Task<ProjectDto> CreateAsync(CreateProjectDto dto, Guid createdByUserId);
    Task<ProjectDto> UpdateAsync(Guid id, UpdateProjectDto dto);
    Task<ProjectDto> UpdateStatusAsync(Guid id, UpdateProjectStatusDto dto);
    Task<ProjectSummaryDto> GetSummaryAsync(Guid id);
    Task<ProjectMemberDto> AddMemberAsync(Guid projectId, AddProjectMemberDto dto);
    Task RemoveMemberAsync(Guid projectId, Guid userId);
    Task<List<ProjectMemberDto>> GetMembersAsync(Guid projectId);
    Task<ProjectStageDto> AddStageAsync(Guid projectId, CreateProjectStageDto dto);
    Task<List<ProjectStageDto>> GetStagesAsync(Guid projectId);
    Task<ProjectStageDto> CompleteStageAsync(Guid projectId, Guid stageId);
    Task DeleteStageAsync(Guid projectId, Guid stageId);
    Task DeleteAsync(Guid id);
}

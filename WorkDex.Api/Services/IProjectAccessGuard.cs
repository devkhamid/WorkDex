using WorkDex.Api.Models;

namespace WorkDex.Api.Services;

public interface IProjectAccessGuard
{
        Task EnsureCanAccessAsync(Guid projectId, Guid userId, UserRole role);

        Task<bool> CanAccessAsync(Guid projectId, Guid userId, UserRole role);
}

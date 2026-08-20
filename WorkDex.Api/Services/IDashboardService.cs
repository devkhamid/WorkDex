using WorkDex.Api.DTOs.Dashboard;
using WorkDex.Api.Models;

namespace WorkDex.Api.Services;

public interface IDashboardService
{
    Task<DashboardStatsDto> GetStatsAsync(Guid requestingUserId, UserRole requestingUserRole);
    Task<List<ProjectStatusDistributionDto>> GetStatusDistributionAsync(Guid requestingUserId, UserRole requestingUserRole);
    Task<List<DashboardRecentActivityDto>> GetRecentActivitiesAsync(Guid requestingUserId, UserRole requestingUserRole, int limit = 10);
}

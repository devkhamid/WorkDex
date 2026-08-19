using WorkDex.Api.DTOs.Dashboard;

namespace WorkDex.Api.Services;

public interface IDashboardService
{
    Task<DashboardStatsDto> GetStatsAsync();
    Task<List<ProjectStatusDistributionDto>> GetStatusDistributionAsync();
    Task<List<DashboardRecentActivityDto>> GetRecentActivitiesAsync(int limit = 10);
}

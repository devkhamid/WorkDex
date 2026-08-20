using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using WorkDex.Api.Helpers;
using WorkDex.Api.Models;
using WorkDex.Api.Services;

namespace WorkDex.Api.Controllers;

[ApiController]
[Route("api/dashboard")]
[Authorize(Roles = "SuperAdmin,Admin,Finance,ProjectManager")]
public class DashboardController : ControllerBase
{
    private readonly IDashboardService _dashboardService;

    public DashboardController(IDashboardService dashboardService)
    {
        _dashboardService = dashboardService;
    }

    [HttpGet("stats")]
    public async Task<IActionResult> GetStats()
    {
        var stats = await _dashboardService.GetStatsAsync(User.GetUserId(), User.GetUserRole());
        return Ok(stats);
    }

    [HttpGet("status-distribution")]
    public async Task<IActionResult> GetStatusDistribution()
    {
        var distribution = await _dashboardService.GetStatusDistributionAsync(User.GetUserId(), User.GetUserRole());
        return Ok(distribution);
    }

    [HttpGet("recent-activities")]
    public async Task<IActionResult> GetRecentActivities([FromQuery] int limit = 10)
    {
        var activities = await _dashboardService.GetRecentActivitiesAsync(User.GetUserId(), User.GetUserRole(), limit);
        return Ok(activities);
    }
}

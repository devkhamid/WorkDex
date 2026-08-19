using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using WorkDex.Api.Helpers;
using WorkDex.Api.Services;

namespace WorkDex.Api.Controllers;

[ApiController]
[Route("api/portal")]
[Authorize]
public class CustomerPortalController : ControllerBase
{
    private readonly ICustomerPortalService _portalService;

    public CustomerPortalController(ICustomerPortalService portalService)
    {
        _portalService = portalService;
    }

    [HttpGet("projects/{projectId:guid}")]
    [Authorize(Roles = "Admin,Finance,ProjectManager,FieldWorker,Customer")]
    public async Task<IActionResult> GetProjectPortal(Guid projectId)
    {
        try
        {
            var userId = User.GetUserId();
            var role = User.GetRole();
            var result = await _portalService.GetProjectPortalAsync(projectId, userId, role);
            return Ok(result);
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
        catch (UnauthorizedAccessException ex)
        {
            return Forbid(ex.Message);
        }
    }
}

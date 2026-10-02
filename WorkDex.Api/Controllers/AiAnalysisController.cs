using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using WorkDex.Api.Helpers;
using WorkDex.Api.Services;

namespace WorkDex.Api.Controllers;

[ApiController]
[Route("api/projects/{projectId:guid}/ai-analysis")]
[Authorize(Roles = "SuperAdmin,Admin,ProjectManager,Finance")]
public class AiAnalysisController : ControllerBase
{
    private readonly IAiAnalysisService _aiService;
    private readonly IProjectAccessGuard _accessGuard;

    public AiAnalysisController(IAiAnalysisService aiService, IProjectAccessGuard accessGuard)
    {
        _aiService = aiService;
        _accessGuard = accessGuard;
    }

    [HttpPost]
    public async Task<IActionResult> Analyze(Guid projectId, [FromBody] AiAnalysisRequestDto? dto, CancellationToken ct)
    {
        if (dto?.Question is { Length: > 2000 })
            return BadRequest(new { message = "Savol juda uzun (maksimal 2000 belgi)." });

        try
        {
            await _accessGuard.EnsureCanAccessAsync(projectId, User.GetUserId(), User.GetUserRole());
            if (!_aiService.IsConfigured)
                return StatusCode(503, new { message = "AI tahlil sozlanmagan: serverda Groq API kaliti yo'q." });

            var result = await _aiService.AnalyzeProjectAsync(projectId, dto?.Question, ct);
            return Ok(result);
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
        catch (HttpRequestException ex)
        {
            return StatusCode(502, new { message = ex.Message });
        }
        catch (TaskCanceledException) when (!ct.IsCancellationRequested)
        {
            return StatusCode(504, new { message = "AI xizmati javob bermadi (vaqt tugadi)." });
        }
    }
}

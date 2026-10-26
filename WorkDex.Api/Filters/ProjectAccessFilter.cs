using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;
using Microsoft.Extensions.DependencyInjection;
using WorkDex.Api.Helpers;
using WorkDex.Api.Services;

namespace WorkDex.Api.Filters;

public class ProjectAccessFilter : IAsyncActionFilter
{
    public async Task OnActionExecutionAsync(ActionExecutingContext context, ActionExecutionDelegate next)
    {
        var user = context.HttpContext.User;

        if (user?.Identity?.IsAuthenticated != true)
        {
            await next();
            return;
        }

        if (!TryGetProjectId(context, out var projectId))
        {
            await next();
            return;
        }

        var guard = context.HttpContext.RequestServices.GetRequiredService<IProjectAccessGuard>();

        Guid userId;
        try
        {
            userId = user.GetUserId();
        }
        catch (UnauthorizedAccessException ex)
        {
            context.Result = new UnauthorizedObjectResult(new { message = ex.Message });
            return;
        }

        var allowed = await guard.CanAccessAsync(projectId, userId, user.GetUserRole());

        if (!allowed)
        {
            context.Result = new NotFoundObjectResult(new { message = "Loyiha topilmadi." });
            return;
        }

        await next();
    }

    private static bool TryGetProjectId(ActionExecutingContext context, out Guid projectId)
    {
        projectId = Guid.Empty;

        if (!context.RouteData.Values.TryGetValue("projectId", out var raw))
            return false;

        return Guid.TryParse(raw?.ToString(), out projectId);
    }
}

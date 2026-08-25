using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;
using Microsoft.Extensions.DependencyInjection;
using WorkDex.Api.Helpers;
using WorkDex.Api.Services;

namespace WorkDex.Api.Filters;

/// <summary>
/// Marshrutida <c>projectId</c> bo'lgan har qanday so'rovda joriy foydalanuvchining
/// shu loyihaga huquqi borligini tekshiradi. Shu bilan barcha ichki resurslar
/// (to'lovlar, xarajatlar, materiallar, usta haqlari, vazifalar, hujjatlar,
/// fotolar, yangilanishlar) begona kompaniyaga ko'rinmaydi.
///
/// Filtr faqat qo'shimcha tekshiruv qo'shadi — mavjud biznes-logika o'zgarmaydi.
/// Ruxsat yo'q bo'lsa loyihaning mavjudligini oshkor qilmaslik uchun 404 qaytadi.
/// </summary>
public class ProjectAccessFilter : IAsyncActionFilter
{
    public async Task OnActionExecutionAsync(ActionExecutingContext context, ActionExecutionDelegate next)
    {
        var user = context.HttpContext.User;

        // Anonim endpointlar va autentifikatsiyadan o'tmagan so'rovlarga aralashmaymiz —
        // ularni [Authorize] atributlari hal qiladi.
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

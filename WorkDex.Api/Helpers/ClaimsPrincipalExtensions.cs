using System.Security.Claims;
using WorkDex.Api.Models;

namespace WorkDex.Api.Helpers;

public static class ClaimsPrincipalExtensions
{
    public static Guid GetUserId(this ClaimsPrincipal user)
    {
        var value = user.FindFirstValue("userId")
            ?? user.FindFirstValue(ClaimTypes.NameIdentifier);

        if (Guid.TryParse(value, out var id))
            return id;

        throw new UnauthorizedAccessException("Token ichida userId topilmadi.");
    }

    public static string GetRole(this ClaimsPrincipal user)
    {
        return user.FindFirstValue(ClaimTypes.Role)
            ?? user.FindFirstValue("role")
            ?? string.Empty;
    }

    public static UserRole GetUserRole(this ClaimsPrincipal user)
    {
        var roleStr = user.GetRole();
        if (Enum.TryParse<UserRole>(roleStr, true, out var role))
            return role;

        return UserRole.FieldWorker;
    }

    public static bool IsSuperAdmin(this ClaimsPrincipal user)
    {
        return user.IsInRole("SuperAdmin");
    }

    public static bool IsAdmin(this ClaimsPrincipal user)
    {
        return user.IsInRole("Admin");
    }
}

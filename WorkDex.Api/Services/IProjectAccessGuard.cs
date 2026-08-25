using WorkDex.Api.Models;

namespace WorkDex.Api.Services;

/// <summary>
/// Loyiha va uning ichki resurslariga (foto, yangilanish, bosqich, moliya) kirish
/// huquqini markazlashgan tarzda tekshiradi.
/// </summary>
public interface IProjectAccessGuard
{
    /// <summary>Ruxsat bo'lmasa yoki loyiha topilmasa <see cref="KeyNotFoundException"/> tashlaydi.</summary>
    Task EnsureCanAccessAsync(Guid projectId, Guid userId, UserRole role);

    /// <summary>Istisno tashlamasdan faqat natijani qaytaradi.</summary>
    Task<bool> CanAccessAsync(Guid projectId, Guid userId, UserRole role);
}

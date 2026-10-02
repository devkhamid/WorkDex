using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using WorkDex.Api.Data;
using WorkDex.Api.Helpers;
using WorkDex.Api.Models;

namespace WorkDex.Api.Controllers;

[ApiController]
[Route("api/notifications")]
[Authorize]
public class NotificationsController : ControllerBase
{
    private readonly AppDbContext _context;

    public NotificationsController(AppDbContext context)
    {
        _context = context;
    }

    /// <summary>Joriy foydalanuvchi kompaniyasidagi so'nggi o'zgarishlar.</summary>
    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] int take = 30)
    {
        var userId = User.GetUserId();
        var companyId = await GetCompanyIdAsync(userId);
        if (companyId is null)
            return Ok(new { items = Array.Empty<object>(), unreadCount = 0, lastReadAt = (DateTime?)null });

        take = Math.Clamp(take, 1, 100);
        var lastReadAt = await _context.NotificationReadStates.AsNoTracking()
            .Where(s => s.UserId == userId)
            .Select(s => (DateTime?)s.LastReadAt)
            .FirstOrDefaultAsync();

        var query = _context.Notifications.AsNoTracking().Where(n => n.CompanyAdminId == companyId);

        var items = await query
            .OrderByDescending(n => n.CreatedAt)
            .Take(take)
            .Select(n => new
            {
                n.Id,
                n.ActorUserId,
                n.ActorName,
                Action = (int)n.Action,
                n.EntityType,
                n.Message,
                n.ProjectId,
                n.CreatedAt,
                IsOwn = n.ActorUserId == userId,
                IsUnread = n.ActorUserId != userId && (lastReadAt == null || n.CreatedAt > lastReadAt)
            })
            .ToListAsync();

        var unreadCount = await query
            .CountAsync(n => n.ActorUserId != userId && (lastReadAt == null || n.CreatedAt > lastReadAt));

        return Ok(new { items, unreadCount, lastReadAt });
    }

    /// <summary>Barcha bildirishnomalarni o'qilgan deb belgilaydi.</summary>
    [HttpPost("read")]
    public async Task<IActionResult> MarkAllRead()
    {
        var userId = User.GetUserId();
        var state = await _context.NotificationReadStates.FirstOrDefaultAsync(s => s.UserId == userId);
        if (state is null)
            _context.NotificationReadStates.Add(new NotificationReadState { UserId = userId, LastReadAt = DateTime.UtcNow });
        else
            state.LastReadAt = DateTime.UtcNow;
        await _context.SaveChangesAsync();
        return NoContent();
    }

    private async Task<Guid?> GetCompanyIdAsync(Guid userId)
    {
        var user = await _context.Users.AsNoTracking()
            .Where(u => u.Id == userId)
            .Select(u => new { u.Id, u.CompanyAdminId, u.Role })
            .FirstOrDefaultAsync();
        if (user is null || user.Role is UserRole.SuperAdmin or UserRole.Customer) return null;
        return user.CompanyAdminId ?? user.Id;
    }
}

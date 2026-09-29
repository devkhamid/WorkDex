using Microsoft.EntityFrameworkCore;
using WorkDex.Api.Data;
using WorkDex.Api.Models;

namespace WorkDex.Api.Services;

/// <summary>
/// Kirish qoidalari <c>ProjectService.GetAllAsync</c> dagi filtrlar bilan bir xil:
/// ro'yxatda ko'rinadigan loyihani ochish mumkin, ko'rinmaydiganini esa yo'q.
/// Shu sababli mavjud (to'g'ri) ish jarayoni o'zgarmaydi — faqat begona
/// kompaniya/mijoz ma'lumotiga kirish yo'li yopiladi.
/// </summary>
public class ProjectAccessGuard : IProjectAccessGuard
{
    private readonly AppDbContext _context;

    public ProjectAccessGuard(AppDbContext context)
    {
        _context = context;
    }

    public async Task EnsureCanAccessAsync(Guid projectId, Guid userId, UserRole role)
    {
        if (!await CanAccessAsync(projectId, userId, role))
        {
            // Loyihaning mavjudligini oshkor qilmaslik uchun 403 emas, "topilmadi" qaytaramiz.
            throw new KeyNotFoundException("Loyiha topilmadi.");
        }
    }

    public async Task<bool> CanAccessAsync(Guid projectId, Guid userId, UserRole role)
    {
        var project = await _context.Projects
            .AsNoTracking()
            .Include(p => p.CreatedByUser)
            .FirstOrDefaultAsync(p => p.Id == projectId);

        if (project is null)
            return false;

        // SuperAdmin — platforma egasi, barcha loyihalarni ko'radi.
        if (role == UserRole.SuperAdmin)
            return true;

        // Mijoz faqat o'ziga bog'langan Customer yozuvi orqali kirishi mumkin.
        if (role == UserRole.Customer)
        {
            return await _context.Customers
                .AsNoTracking()
                .AnyAsync(c => c.Id == project.CustomerId && c.UserId == userId);
        }

        // Admin — o'z kompaniyasining loyihalari.
        if (role == UserRole.Admin)
        {
            var admin = await _context.Users
                .AsNoTracking()
                .FirstOrDefaultAsync(u => u.Id == userId);
            var adminId = admin?.CompanyAdminId ?? userId;

            return project.CreatedByUserId == userId ||
                   project.CreatedByUserId == adminId ||
                   project.CompanyAdminId == adminId ||
                   (project.CreatedByUser != null && project.CreatedByUser.CompanyAdminId == adminId);
        }

        // ProjectManager, FieldWorker, Finance — kompaniya bo'yicha yoki loyiha a'zosi bo'lsa.
        var user = await _context.Users
            .AsNoTracking()
            .FirstOrDefaultAsync(u => u.Id == userId);

        var targetCompanyAdminId = user?.CompanyAdminId ?? userId;

        if (project.CreatedByUserId == userId || project.CompanyAdminId == targetCompanyAdminId)
            return true;

        return await _context.ProjectMembers
            .AsNoTracking()
            .AnyAsync(m => m.ProjectId == projectId && m.UserId == userId);
    }
}

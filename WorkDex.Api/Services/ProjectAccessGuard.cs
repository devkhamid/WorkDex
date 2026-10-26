using Microsoft.EntityFrameworkCore;
using WorkDex.Api.Data;
using WorkDex.Api.Models;

namespace WorkDex.Api.Services;

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

        if (role == UserRole.SuperAdmin)
            return true;

        if (role == UserRole.Customer)
        {
            return await _context.Customers
                .AsNoTracking()
                .AnyAsync(c => c.Id == project.CustomerId && c.UserId == userId);
        }

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

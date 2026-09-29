using Microsoft.EntityFrameworkCore;
using WorkDex.Api.Data;
using WorkDex.Api.DTOs.Users;
using WorkDex.Api.Models;

namespace WorkDex.Api.Services;

public class UserService : IUserService
{
    private readonly AppDbContext _context;

    public UserService(AppDbContext context)
    {
        _context = context;
    }

    public async Task<UserDto> GetCurrentUserAsync(Guid userId)
    {
        var user = await _context.Users.FindAsync(userId);

        if (user is null)
            throw new KeyNotFoundException("Foydalanuvchi topilmadi.");

        return MapToDto(user);
    }

    public async Task<List<UserDto>> GetAllUsersAsync(Guid requestingUserId, UserRole requestingUserRole)
    {
        var query = _context.Users.AsQueryable();

        if (requestingUserRole == UserRole.SuperAdmin)
        {
            // SuperAdmin barcha foydalanuvchilarni ko'radi
        }
        else
        {
            var user = await _context.Users.FindAsync(requestingUserId);
            var targetCompanyAdminId = user?.CompanyAdminId ?? requestingUserId;
            query = query.Where(u => u.CompanyAdminId == targetCompanyAdminId || u.Id == targetCompanyAdminId);
        }

        var users = await query.OrderBy(u => u.FirstName).ToListAsync();
        return users.Select(MapToDto).ToList();
    }

    public async Task<UserDto> GetUserByIdAsync(Guid id, Guid requestingUserId, UserRole requestingUserRole)
    {
        var user = await _context.Users.FindAsync(id);
        if (user is null)
            throw new KeyNotFoundException("Foydalanuvchi topilmadi.");
        await EnsureSameCompanyAsync(user, requestingUserId, requestingUserRole);
        return MapToDto(user);
    }

    public async Task<UserDto> UpdateUserAsync(Guid id, UpdateUserDto dto, Guid requestingUserId, UserRole requestingUserRole)
    {
        var user = await _context.Users.FindAsync(id);
        if (user is null)
            throw new KeyNotFoundException("Foydalanuvchi topilmadi.");
        await EnsureSameCompanyAsync(user, requestingUserId, requestingUserRole);
        EnsureCanModify(user, requestingUserId, requestingUserRole);

        if (dto.Role == UserRole.SuperAdmin)
            throw new InvalidOperationException("SuperAdmin rolini berish taqiqlangan.");
        if (IsCompanyOwner(user) && dto.Role != UserRole.Admin)
            throw new InvalidOperationException("Kompaniya asosiy adminining rolini o'zgartirib bo'lmaydi.");

        user.FirstName = dto.FirstName.Trim();
        user.LastName = dto.LastName.Trim();
        user.PhoneNumber = dto.PhoneNumber?.Trim();
        user.Role = dto.Role;
        user.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();
        return MapToDto(user);
    }

    public async Task<UserDto> ToggleActiveAsync(Guid id, Guid requestingUserId, UserRole requestingUserRole)
    {
        var user = await _context.Users.FindAsync(id);
        if (user is null)
            throw new KeyNotFoundException("Foydalanuvchi topilmadi.");
        await EnsureSameCompanyAsync(user, requestingUserId, requestingUserRole);
        EnsureCanModify(user, requestingUserId, requestingUserRole);

        if (user.Role == UserRole.SuperAdmin)
            throw new InvalidOperationException("Asosiy SuperAdmin hisobini o'chirib yoki bloklab bo'lmaydi.");

        user.IsActive = !user.IsActive;
        user.UpdatedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync();
        return MapToDto(user);
    }

    public async Task DeleteUserAsync(Guid id)
    {
        var user = await _context.Users.FindAsync(id);

        if (user is null)
            throw new KeyNotFoundException("Foydalanuvchi topilmadi.");

        if (user.Role == UserRole.SuperAdmin)
            throw new InvalidOperationException("Asosiy SuperAdmin hisobini o'chirib bo'lmaydi.");

        if (IsCompanyOwner(user))
        {
            // Kompaniya admini va unga tegishli barcha loyihalar va xodimlarni to'liq tozalash
            var companyUserIds = await _context.Users
                .Where(u => u.CompanyAdminId == id || u.Id == id)
                .Select(u => u.Id)
                .ToListAsync();

            var projectIds = await _context.Projects
                .Where(p => p.CompanyAdminId == id || p.CreatedByUserId == id || companyUserIds.Contains(p.CreatedByUserId))
                .Select(p => p.Id)
                .ToListAsync();

            if (projectIds.Any())
            {
                var updates = await _context.ProjectUpdates.Where(x => projectIds.Contains(x.ProjectId)).ToListAsync();
                _context.ProjectUpdates.RemoveRange(updates);

                var photos = await _context.Photos.Where(x => projectIds.Contains(x.ProjectId)).ToListAsync();
                _context.Photos.RemoveRange(photos);

                var docs = await _context.Documents.Where(x => projectIds.Contains(x.ProjectId)).ToListAsync();
                _context.Documents.RemoveRange(docs);

                var tasks = await _context.Tasks.Where(x => projectIds.Contains(x.ProjectId)).ToListAsync();
                _context.Tasks.RemoveRange(tasks);

                var extraWorks = await _context.ExtraWorks.Where(x => projectIds.Contains(x.ProjectId)).ToListAsync();
                _context.ExtraWorks.RemoveRange(extraWorks);

                var workerPayments = await _context.WorkerPayments.Where(x => projectIds.Contains(x.ProjectId)).ToListAsync();
                _context.WorkerPayments.RemoveRange(workerPayments);

                var materialPurchases = await _context.MaterialPurchases.Where(x => projectIds.Contains(x.ProjectId)).ToListAsync();
                _context.MaterialPurchases.RemoveRange(materialPurchases);

                var expenses = await _context.Expenses.Where(x => x.ProjectId != null && projectIds.Contains(x.ProjectId.Value)).ToListAsync();
                _context.Expenses.RemoveRange(expenses);

                var payments = await _context.Payments.Where(x => projectIds.Contains(x.ProjectId)).ToListAsync();
                _context.Payments.RemoveRange(payments);

                var stages = await _context.ProjectStages.Where(x => projectIds.Contains(x.ProjectId)).ToListAsync();
                _context.ProjectStages.RemoveRange(stages);

                var members = await _context.ProjectMembers.Where(x => projectIds.Contains(x.ProjectId)).ToListAsync();
                _context.ProjectMembers.RemoveRange(members);

                var projects = await _context.Projects.Where(x => projectIds.Contains(x.Id)).ToListAsync();
                _context.Projects.RemoveRange(projects);
            }

            var companyCustomers = await _context.Customers.Where(c => c.CompanyAdminId == id).ToListAsync();
            _context.Customers.RemoveRange(companyCustomers);

            var companyWorkers = await _context.Workers.Where(w => w.CompanyAdminId == id).ToListAsync();
            _context.Workers.RemoveRange(companyWorkers);

            var companyMaterials = await _context.Materials.Where(m => m.CompanyAdminId == id).ToListAsync();
            _context.Materials.RemoveRange(companyMaterials);

            var otherMembers = await _context.ProjectMembers.Where(m => companyUserIds.Contains(m.UserId)).ToListAsync();
            _context.ProjectMembers.RemoveRange(otherMembers);

            var companyUsers = await _context.Users.Where(u => companyUserIds.Contains(u.Id)).ToListAsync();
            _context.Users.RemoveRange(companyUsers);
        }
        else
        {
            // Alohida xodimni o'chirish
            var members = await _context.ProjectMembers.Where(m => m.UserId == id).ToListAsync();
            _context.ProjectMembers.RemoveRange(members);

            var assignedTasks = await _context.Tasks.Where(t => t.AssignedToUserId == id).ToListAsync();
            foreach (var t in assignedTasks)
            {
                t.AssignedToUserId = null;
            }

            _context.Users.Remove(user);
        }

        await _context.SaveChangesAsync();
    }

    private async Task<Guid> ResolveCompanyAdminIdAsync(Guid requestingUserId, UserRole requestingUserRole)
    {
        var user = await _context.Users.FindAsync(requestingUserId);
        return user?.CompanyAdminId ?? requestingUserId;
    }

    // Asosiy (kompaniya egasi) admin — CompanyAdminId bo'sh; yordamchi adminlarda u to'ldirilgan.
    private static bool IsCompanyOwner(User user) =>
        user.Role == UserRole.Admin && user.CompanyAdminId == null;

    private static void EnsureCanModify(User targetUser, Guid requestingUserId, UserRole requestingUserRole)
    {
        if (requestingUserRole != UserRole.SuperAdmin && IsCompanyOwner(targetUser) && targetUser.Id != requestingUserId)
            throw new InvalidOperationException("Kompaniya asosiy adminini faqat uning o'zi o'zgartira oladi.");
    }

    private async Task EnsureSameCompanyAsync(User targetUser, Guid requestingUserId, UserRole requestingUserRole)
    {
        if (requestingUserRole == UserRole.SuperAdmin) return;
        var companyAdminId = await ResolveCompanyAdminIdAsync(requestingUserId, requestingUserRole);
        if (targetUser.CompanyAdminId != companyAdminId && targetUser.Id != companyAdminId)
            throw new KeyNotFoundException("Foydalanuvchi topilmadi.");
    }

    // User entity ni UserDto ga aylantirish — PasswordHash hech qachon qaytarilmaydi
    private static UserDto MapToDto(User user) => new()
    {
        Id = user.Id,
        FirstName = user.FirstName,
        LastName = user.LastName,
        FullName = user.FullName,
        Email = user.Email,
        PhoneNumber = user.PhoneNumber,
        CompanyName = user.CompanyName,
        Role = user.Role,
        RoleName = user.Role.ToString(),
        IsActive = user.IsActive,
        CreatedAt = user.CreatedAt
    };
}

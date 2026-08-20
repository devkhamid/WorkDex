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

    public async Task<List<UserDto>> GetAllUsersAsync()
    {
        var users = await _context.Users
            .OrderBy(u => u.FirstName)
            .ToListAsync();

        return users.Select(MapToDto).ToList();
    }

    public async Task<UserDto> GetUserByIdAsync(Guid id)
    {
        var user = await _context.Users.FindAsync(id);

        if (user is null)
            throw new KeyNotFoundException("Foydalanuvchi topilmadi.");

        return MapToDto(user);
    }

    public async Task<UserDto> UpdateUserAsync(Guid id, UpdateUserDto dto)
    {
        var user = await _context.Users.FindAsync(id);

        if (user is null)
            throw new KeyNotFoundException("Foydalanuvchi topilmadi.");

        user.FirstName = dto.FirstName.Trim();
        user.LastName = dto.LastName.Trim();
        user.PhoneNumber = dto.PhoneNumber?.Trim();
        user.Role = dto.Role;
        user.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        return MapToDto(user);
    }

    public async Task<UserDto> ToggleActiveAsync(Guid id)
    {
        var user = await _context.Users.FindAsync(id);

        if (user is null)
            throw new KeyNotFoundException("Foydalanuvchi topilmadi.");

        if (user.Role == UserRole.SuperAdmin)
            throw new InvalidOperationException("Asosiy SuperAdmin hisobini o'chirib yoki bloklab bo'lmaydi.");

        user.IsActive = !user.IsActive;
        user.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        return MapToDto(user);
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

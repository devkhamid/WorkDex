using Microsoft.EntityFrameworkCore;
using WorkDex.Api.Data;
using WorkDex.Api.DTOs.Auth;
using WorkDex.Api.Models;

namespace WorkDex.Api.Services;

public class AuthService : IAuthService
{
    private readonly AppDbContext _context;
    private readonly IJwtService _jwtService;

    public AuthService(AppDbContext context, IJwtService jwtService)
    {
        _context = context;
        _jwtService = jwtService;
    }

    public async Task<AuthResponseDto> RegisterAsync(RegisterDto dto)
    {
        // Email allaqachon mavjudligini tekshiramiz
        var emailExists = await _context.Users
            .AnyAsync(u => u.Email.ToLower() == dto.Email.ToLower());

        if (emailExists)
            throw new InvalidOperationException("Bu email allaqachon ro'yxatdan o'tgan.");

        // SuperAdmin faqat tizimda 1 ta bo'ladi va uni tashqaridan yaratib bo'lmaydi!
        if (dto.Role == UserRole.SuperAdmin)
            throw new InvalidOperationException("SuperAdmin rolini yaratish taqiqlangan! Tizimda faqat yagona SuperAdmin mavjud bo'ladi.");

        var user = new User
        {
            FirstName = dto.FirstName.Trim(),
            LastName = dto.LastName.Trim(),
            Email = dto.Email.Trim().ToLower(),
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(dto.Password),
            PhoneNumber = dto.PhoneNumber?.Trim(),
            CompanyName = dto.CompanyName?.Trim(),
            Role = dto.Role,
            IsActive = true,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        _context.Users.Add(user);
        await _context.SaveChangesAsync();

        return BuildAuthResponse(user);
    }

    public async Task<AuthResponseDto> LoginAsync(LoginDto dto)
    {
        var searchInput = dto.Email.Trim().ToLower();
        var user = await _context.Users
            .FirstOrDefaultAsync(u => u.Email.ToLower() == searchInput ||
                                     (searchInput == "superadmin" && u.Role == UserRole.SuperAdmin) ||
                                     (searchInput == "super admin" && u.Role == UserRole.SuperAdmin));

        if (user is null || !BCrypt.Net.BCrypt.Verify(dto.Password, user.PasswordHash))
            throw new UnauthorizedAccessException("Email yoki parol noto'g'ri.");

        if (!user.IsActive)
            throw new UnauthorizedAccessException("Hisobingiz faol emas. Admin bilan bog'laning.");

        return BuildAuthResponse(user);
    }

    private AuthResponseDto BuildAuthResponse(User user)
    {
        return new AuthResponseDto
        {
            Token = _jwtService.GenerateToken(user),
            UserId = user.Id,
            FullName = user.FullName,
            Email = user.Email,
            Role = user.Role,
            ExpiresAt = _jwtService.GetExpirationDate()
        };
    }
}

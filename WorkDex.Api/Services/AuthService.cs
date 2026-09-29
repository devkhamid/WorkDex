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

    public async Task<AuthResponseDto> RegisterAsync(RegisterDto dto, UserRole callerRole, Guid callerId)
    {
        // Kim kimni yaratishi mumkin:
        //   SuperAdmin -> Admin (yangi kompaniya)
        //   Admin      -> Admin (yordamchi admin / direktor o'rinbosari), ProjectManager, FieldWorker, Finance, Customer (o'z kompaniyasida)
        // SuperAdmin rolini hech kim yaratib bo'lmaydi.
        if (dto.Role == UserRole.SuperAdmin)
            throw new UnauthorizedAccessException("SuperAdmin rolini yaratish taqiqlangan! Tizimda faqat yagona SuperAdmin mavjud bo'ladi.");

        Guid? companyAdminId;
        var companyName = dto.CompanyName?.Trim();

        switch (callerRole)
        {
            case UserRole.SuperAdmin:
                if (dto.Role != UserRole.Admin)
                    throw new UnauthorizedAccessException("SuperAdmin faqat kompaniya Admin hisobini yarata oladi.");
                // Admin — kompaniyaning ildizi, u hech kimga bo'ysunmaydi.
                companyAdminId = null;
                break;

            case UserRole.Admin:
                // Yordamchi admin yaratgan xodimlar ham asosiy admin kompaniyasiga bog'lanadi.
                var caller = await _context.Users.FindAsync(callerId);
                companyAdminId = caller?.CompanyAdminId ?? callerId;
                if (dto.Role == UserRole.Admin && string.IsNullOrWhiteSpace(companyName))
                    companyName = (await _context.Users.FindAsync(companyAdminId))?.CompanyName;
                break;

            default:
                throw new UnauthorizedAccessException("Yangi foydalanuvchi yaratish uchun ruxsatingiz yo'q.");
        }

        // Email allaqachon mavjudligini tekshiramiz
        var emailExists = await _context.Users
            .AnyAsync(u => u.Email.ToLower() == dto.Email.ToLower());

        if (emailExists)
            throw new InvalidOperationException("Bu email allaqachon ro'yxatdan o'tgan.");

        var user = new User
        {
            FirstName = dto.FirstName.Trim(),
            LastName = dto.LastName.Trim(),
            Email = dto.Email.Trim().ToLower(),
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(dto.Password),
            PhoneNumber = dto.PhoneNumber?.Trim(),
            CompanyName = companyName,
            CompanyAdminId = companyAdminId,
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

        // "superadmin" qisqa taxallusi bilan kirishga ruxsat beramiz, lekin parol
        // har doim odatdagidek tekshiriladi — hech qanday zaxira parol yo'q.
        var isSuperAdminAlias = searchInput is "superadmin" or "super admin";

        var user = await _context.Users
            .FirstOrDefaultAsync(u => u.Email.ToLower() == searchInput ||
                                     (isSuperAdminAlias && u.Role == UserRole.SuperAdmin));

        if (user is null)
            throw new UnauthorizedAccessException("Email yoki parol noto'g'ri.");

        if (!BCrypt.Net.BCrypt.Verify(dto.Password, user.PasswordHash))
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

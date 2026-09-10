using WorkDex.Api.DTOs.Auth;
using WorkDex.Api.Models;

namespace WorkDex.Api.Services;

public interface IAuthService
{
    /// <summary>
    /// Yangi foydalanuvchi yaratadi. Faqat SuperAdmin va Admin chaqirishi mumkin:
    /// SuperAdmin — kompaniya Adminlarini, Admin — o'z kompaniyasi xodimlari va mijozlarini.
    /// </summary>
    Task<AuthResponseDto> RegisterAsync(RegisterDto dto, UserRole callerRole, Guid callerId);

    Task<AuthResponseDto> LoginAsync(LoginDto dto);
}





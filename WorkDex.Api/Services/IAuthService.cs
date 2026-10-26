using WorkDex.Api.DTOs.Auth;
using WorkDex.Api.Models;

namespace WorkDex.Api.Services;

public interface IAuthService
{
        Task<AuthResponseDto> RegisterAsync(RegisterDto dto, UserRole callerRole, Guid callerId);

    Task<AuthResponseDto> LoginAsync(LoginDto dto);
}





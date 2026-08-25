using WorkDex.Api.DTOs.Users;
using WorkDex.Api.Models;

namespace WorkDex.Api.Services;

public interface IUserService
{
    Task<UserDto> GetCurrentUserAsync(Guid userId);
    Task<List<UserDto>> GetAllUsersAsync(Guid requestingUserId, UserRole requestingUserRole);
    Task<UserDto> GetUserByIdAsync(Guid id, Guid requestingUserId, UserRole requestingUserRole);
    Task<UserDto> UpdateUserAsync(Guid id, UpdateUserDto dto, Guid requestingUserId, UserRole requestingUserRole);
    Task<UserDto> ToggleActiveAsync(Guid id, Guid requestingUserId, UserRole requestingUserRole);
    Task DeleteUserAsync(Guid id);
}

using WorkDex.Api.DTOs.Users;

namespace WorkDex.Api.Services;

public interface IUserService
{
    Task<UserDto> GetCurrentUserAsync(Guid userId);
    Task<List<UserDto>> GetAllUsersAsync();
    Task<UserDto> GetUserByIdAsync(Guid id);
    Task<UserDto> UpdateUserAsync(Guid id, UpdateUserDto dto);
    Task<UserDto> ToggleActiveAsync(Guid id);
    Task DeleteUserAsync(Guid id);
}

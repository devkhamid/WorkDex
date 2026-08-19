using WorkDex.Api.Models;

namespace WorkDex.Api.Services;

public interface IJwtService
{
    string GenerateToken(User user);
    DateTime GetExpirationDate();
}

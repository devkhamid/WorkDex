using WorkDex.Api.DTOs.Portal;

namespace WorkDex.Api.Services;

public interface ICustomerPortalService
{
    Task<CustomerPortalProjectDto> GetProjectPortalAsync(Guid projectId, Guid requestingUserId, string requestingUserRole);
}

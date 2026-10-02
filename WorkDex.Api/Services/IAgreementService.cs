using WorkDex.Api.DTOs.Agreements;
using WorkDex.Api.Models;

namespace WorkDex.Api.Services;

public interface IAgreementService
{
    Task<List<AgreementDto>> GetAllAsync(Guid requestingUserId, UserRole requestingUserRole);
    Task<AgreementDto?> GetByIdAsync(Guid id, Guid requestingUserId, UserRole requestingUserRole);
    Task<AgreementDto> CreateAsync(CreateAgreementDto dto, Guid createdByUserId, UserRole role);
    Task<AgreementDto> UpdateAsync(Guid id, UpdateAgreementDto dto, Guid requestingUserId, UserRole requestingUserRole);
    Task<AgreementDto> FinalizeAsync(Guid id, FinalizeAgreementDto dto, Guid createdByUserId, UserRole requestingUserRole);
    Task DeleteAsync(Guid id, Guid requestingUserId, UserRole requestingUserRole);
    Task<int> GetNextContractNumberAsync(Guid userId, UserRole role);
}

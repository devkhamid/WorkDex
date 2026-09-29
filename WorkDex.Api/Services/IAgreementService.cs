using WorkDex.Api.DTOs.Agreements;
using WorkDex.Api.Models;

namespace WorkDex.Api.Services;

public interface IAgreementService
{
    Task<List<AgreementDto>> GetAllAsync(Guid requestingUserId, UserRole requestingUserRole);
    Task<AgreementDto?> GetByIdAsync(Guid id);
    Task<AgreementDto> CreateAsync(CreateAgreementDto dto, Guid createdByUserId, UserRole role);
    Task<AgreementDto> UpdateAsync(Guid id, UpdateAgreementDto dto);
    Task<AgreementDto> FinalizeAsync(Guid id, FinalizeAgreementDto dto, Guid createdByUserId);
    Task DeleteAsync(Guid id);
    Task<int> GetNextContractNumberAsync(Guid userId, UserRole role);
}

using WorkDex.Api.DTOs.Materials;
using WorkDex.Api.Models;

namespace WorkDex.Api.Services;

public interface IMaterialService
{
    Task<List<MaterialDto>> GetAllMaterialsAsync(Guid requestingUserId, UserRole requestingUserRole);
    Task<MaterialDto> GetMaterialByIdAsync(Guid id, Guid requestingUserId, UserRole requestingUserRole);
    Task<MaterialDto> CreateMaterialAsync(CreateMaterialDto dto, Guid createdByUserId);
    Task<MaterialDto> UpdateMaterialAsync(Guid id, CreateMaterialDto dto, Guid requestingUserId, UserRole requestingUserRole);
    Task DeleteMaterialAsync(Guid id, Guid requestingUserId, UserRole requestingUserRole);
    Task<MaterialDto> MergeMaterialAsync(Guid sourceId, Guid targetId, Guid requestingUserId, UserRole requestingUserRole);

    Task<MaterialPurchaseDto> AddPurchaseAsync(Guid projectId, CreateMaterialPurchaseDto dto, Guid createdByUserId);
    Task<List<MaterialPurchaseDto>> GetPurchasesByProjectAsync(Guid projectId);
    Task<MaterialPurchaseDto> GetPurchaseByIdAsync(Guid projectId, Guid purchaseId);
    Task DeletePurchaseAsync(Guid projectId, Guid purchaseId);
    Task<List<ProjectMaterialSummaryDto>> GetProjectMaterialSummaryAsync(Guid projectId);

    Task<List<MaterialUsageDto>> GetMaterialUsageAsync(Guid requestingUserId, UserRole requestingUserRole, DateTime? from, DateTime? to);
}

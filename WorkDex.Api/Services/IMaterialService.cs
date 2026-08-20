using WorkDex.Api.DTOs.Materials;
using WorkDex.Api.Models;

namespace WorkDex.Api.Services;

public interface IMaterialService
{
    // Katalog operatsiyalari
    Task<List<MaterialDto>> GetAllMaterialsAsync(Guid requestingUserId, UserRole requestingUserRole);
    Task<MaterialDto> GetMaterialByIdAsync(Guid id);
    Task<MaterialDto> CreateMaterialAsync(CreateMaterialDto dto, Guid createdByUserId);
    Task<MaterialDto> UpdateMaterialAsync(Guid id, CreateMaterialDto dto);
    Task DeleteMaterialAsync(Guid id);

    // Loyiha xaridlari
    Task<MaterialPurchaseDto> AddPurchaseAsync(Guid projectId, CreateMaterialPurchaseDto dto, Guid createdByUserId);
    Task<List<MaterialPurchaseDto>> GetPurchasesByProjectAsync(Guid projectId);
    Task<MaterialPurchaseDto> GetPurchaseByIdAsync(Guid projectId, Guid purchaseId);
    Task DeletePurchaseAsync(Guid projectId, Guid purchaseId);
    Task<List<ProjectMaterialSummaryDto>> GetProjectMaterialSummaryAsync(Guid projectId);
}

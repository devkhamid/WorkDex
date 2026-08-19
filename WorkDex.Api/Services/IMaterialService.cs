using WorkDex.Api.DTOs.Materials;

namespace WorkDex.Api.Services;

public interface IMaterialService
{
    // Katalog operatsiyalari
    Task<List<MaterialDto>> GetAllMaterialsAsync();
    Task<MaterialDto> GetMaterialByIdAsync(Guid id);
    Task<MaterialDto> CreateMaterialAsync(CreateMaterialDto dto);
    Task<MaterialDto> UpdateMaterialAsync(Guid id, CreateMaterialDto dto);
    Task DeleteMaterialAsync(Guid id);

    // Loyiha xaridlari
    Task<MaterialPurchaseDto> AddPurchaseAsync(Guid projectId, CreateMaterialPurchaseDto dto, Guid createdByUserId);
    Task<List<MaterialPurchaseDto>> GetPurchasesByProjectAsync(Guid projectId);
    Task<MaterialPurchaseDto> GetPurchaseByIdAsync(Guid projectId, Guid purchaseId);
    Task DeletePurchaseAsync(Guid projectId, Guid purchaseId);
    Task<List<ProjectMaterialSummaryDto>> GetProjectMaterialSummaryAsync(Guid projectId);
}

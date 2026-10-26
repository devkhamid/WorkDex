using WorkDex.Api.DTOs.Documents;
using WorkDex.Api.DTOs.Photos;
using WorkDex.Api.DTOs.Updates;

namespace WorkDex.Api.Services;

public interface IProjectMediaService
{
    Task<DocumentDto> AddDocumentAsync(Guid projectId, CreateDocumentDto dto, Guid uploadedByUserId);
    Task<DocumentDto> UploadDocumentAsync(Guid projectId, IFormFile file, string? title, string? fileType, Guid uploadedByUserId);
    Task<List<DocumentDto>> GetDocumentsAsync(Guid projectId);
    Task<(string FullPath, string FileName)?> GetDocumentFileAsync(Guid projectId, Guid documentId);
    Task DeleteDocumentAsync(Guid projectId, Guid documentId);

    Task<PhotoDto> AddPhotoAsync(Guid projectId, CreatePhotoDto dto, Guid uploadedByUserId);
    Task<List<PhotoDto>> GetPhotosAsync(Guid projectId, bool onlyCustomerVisible = false);
    Task DeletePhotoAsync(Guid projectId, Guid photoId);

    Task<ProjectUpdateDto> AddUpdateAsync(Guid projectId, CreateProjectUpdateDto dto, Guid createdByUserId);
    Task<List<ProjectUpdateDto>> GetUpdatesAsync(Guid projectId, bool onlyCustomerVisible = false);
    Task DeleteUpdateAsync(Guid projectId, Guid updateId);
}

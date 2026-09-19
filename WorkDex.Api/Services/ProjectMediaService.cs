using Microsoft.EntityFrameworkCore;
using WorkDex.Api.Data;
using WorkDex.Api.DTOs.Documents;
using WorkDex.Api.DTOs.Photos;
using WorkDex.Api.DTOs.Updates;
using WorkDex.Api.Models;

namespace WorkDex.Api.Services;

public class ProjectMediaService : IProjectMediaService
{
    private readonly AppDbContext _context;
    private readonly IWebHostEnvironment _env;

    public ProjectMediaService(AppDbContext context, IWebHostEnvironment env)
    {
        _context = context;
        _env = env;
    }

    // Documents
    public async Task<DocumentDto> UploadDocumentAsync(Guid projectId, IFormFile file, string? title, string? fileType, Guid uploadedByUserId)
    {
        if (file == null || file.Length == 0)
            throw new ArgumentException("Fayl tanlanmagan.");

        var project = await _context.Projects.FindAsync(projectId);
        if (project is null)
            throw new KeyNotFoundException("Loyiha topilmadi.");

        var user = await _context.Users.FindAsync(uploadedByUserId);
        if (user is null)
            throw new KeyNotFoundException("Foydalanuvchi topilmadi.");

        var rootPath = _env.WebRootPath ?? Path.Combine(Directory.GetCurrentDirectory(), "wwwroot");
        var folder = Path.Combine(rootPath, "uploads", "documents", projectId.ToString());
        if (!Directory.Exists(folder))
        {
            Directory.CreateDirectory(folder);
        }

        var ext = Path.GetExtension(file.FileName);
        var safeFileName = $"{Guid.NewGuid():N}_{Path.GetFileNameWithoutExtension(file.FileName)}{ext}";
        var fullPath = Path.Combine(folder, safeFileName);

        using (var stream = new FileStream(fullPath, FileMode.Create))
        {
            await file.CopyToAsync(stream);
        }

        var relativePath = $"/uploads/documents/{projectId}/{safeFileName}";
        var finalTitle = !string.IsNullOrWhiteSpace(title) ? title.Trim() : Path.GetFileNameWithoutExtension(file.FileName);
        var finalType = !string.IsNullOrWhiteSpace(fileType) ? fileType.Trim() : ext.TrimStart('.').ToLowerInvariant();

        var doc = new ProjectDocument
        {
            ProjectId = projectId,
            Title = finalTitle,
            FilePath = relativePath,
            FileType = finalType,
            FileSizeBytes = file.Length,
            UploadedByUserId = uploadedByUserId,
            CreatedAt = DateTime.UtcNow
        };

        _context.Documents.Add(doc);
        await _context.SaveChangesAsync();

        return new DocumentDto
        {
            Id = doc.Id,
            ProjectId = doc.ProjectId,
            Title = doc.Title,
            FilePath = doc.FilePath,
            FileType = doc.FileType,
            FileSizeBytes = doc.FileSizeBytes,
            UploadedByUserId = doc.UploadedByUserId,
            UploadedByName = user.FullName,
            CreatedAt = doc.CreatedAt
        };
    }

    public async Task<DocumentDto> AddDocumentAsync(Guid projectId, CreateDocumentDto dto, Guid uploadedByUserId)
    {
        var project = await _context.Projects.FindAsync(projectId);
        if (project is null)
            throw new KeyNotFoundException("Loyiha topilmadi.");

        var user = await _context.Users.FindAsync(uploadedByUserId);
        if (user is null)
            throw new KeyNotFoundException("Foydalanuvchi topilmadi.");

        var doc = new ProjectDocument
        {
            ProjectId = projectId,
            Title = dto.Title.Trim(),
            FilePath = dto.FilePath.Trim(),
            FileType = dto.FileType?.Trim(),
            FileSizeBytes = dto.FileSizeBytes,
            UploadedByUserId = uploadedByUserId,
            CreatedAt = DateTime.UtcNow
        };

        _context.Documents.Add(doc);
        await _context.SaveChangesAsync();

        return new DocumentDto
        {
            Id = doc.Id,
            ProjectId = doc.ProjectId,
            Title = doc.Title,
            FilePath = doc.FilePath,
            FileType = doc.FileType,
            FileSizeBytes = doc.FileSizeBytes,
            UploadedByUserId = doc.UploadedByUserId,
            UploadedByName = user.FullName,
            CreatedAt = doc.CreatedAt
        };
    }

    public async Task<List<DocumentDto>> GetDocumentsAsync(Guid projectId)
    {
        var projectExists = await _context.Projects.AnyAsync(p => p.Id == projectId);
        if (!projectExists)
            throw new KeyNotFoundException("Loyiha topilmadi.");

        var docs = await _context.Documents
            .Include(d => d.UploadedByUser)
            .Where(d => d.ProjectId == projectId)
            .OrderByDescending(d => d.CreatedAt)
            .ToListAsync();

        return docs.Select(d => new DocumentDto
        {
            Id = d.Id,
            ProjectId = d.ProjectId,
            Title = d.Title,
            FilePath = d.FilePath,
            FileType = d.FileType,
            FileSizeBytes = d.FileSizeBytes,
            UploadedByUserId = d.UploadedByUserId,
            UploadedByName = d.UploadedByUser?.FullName ?? "",
            CreatedAt = d.CreatedAt
        }).ToList();
    }

    public async Task DeleteDocumentAsync(Guid projectId, Guid documentId)
    {
        var doc = await _context.Documents
            .FirstOrDefaultAsync(d => d.Id == documentId && d.ProjectId == projectId);

        if (doc is null)
            throw new KeyNotFoundException("Hujjat topilmadi.");

        if (!string.IsNullOrEmpty(doc.FilePath) && doc.FilePath.StartsWith("/uploads/"))
        {
            try
            {
                var rootPath = _env.WebRootPath ?? Path.Combine(Directory.GetCurrentDirectory(), "wwwroot");
                var diskPath = Path.Combine(rootPath, doc.FilePath.TrimStart('/').Replace('/', Path.DirectorySeparatorChar));
                if (File.Exists(diskPath))
                {
                    File.Delete(diskPath);
                }
            }
            catch
            {
                // Silently ignore disk cleanup errors to avoid blocking DB deletion
            }
        }

        _context.Documents.Remove(doc);
        await _context.SaveChangesAsync();
    }

    // Photos
    public async Task<PhotoDto> AddPhotoAsync(Guid projectId, CreatePhotoDto dto, Guid uploadedByUserId)
    {
        var project = await _context.Projects.FindAsync(projectId);
        if (project is null)
            throw new KeyNotFoundException("Loyiha topilmadi.");

        var user = await _context.Users.FindAsync(uploadedByUserId);
        if (user is null)
            throw new KeyNotFoundException("Foydalanuvchi topilmadi.");

        if (dto.StageId.HasValue)
        {
            var stageExists = await _context.ProjectStages
                .AnyAsync(s => s.Id == dto.StageId.Value && s.ProjectId == projectId);
            if (!stageExists)
                throw new KeyNotFoundException("Bosqich topilmadi.");
        }

        var photo = new ProjectPhoto
        {
            ProjectId = projectId,
            StageId = dto.StageId,
            PhotoUrl = dto.PhotoUrl.Trim(),
            Caption = dto.Caption?.Trim(),
            IsVisibleToCustomer = dto.IsVisibleToCustomer,
            PhotoDate = dto.PhotoDate,
            UploadedByUserId = uploadedByUserId,
            CreatedAt = DateTime.UtcNow
        };

        _context.Photos.Add(photo);
        await _context.SaveChangesAsync();

        var stage = dto.StageId.HasValue ? await _context.ProjectStages.FindAsync(dto.StageId.Value) : null;

        return new PhotoDto
        {
            Id = photo.Id,
            ProjectId = photo.ProjectId,
            StageId = photo.StageId,
            StageName = stage?.Name,
            PhotoUrl = photo.PhotoUrl,
            Caption = photo.Caption,
            IsVisibleToCustomer = photo.IsVisibleToCustomer,
            PhotoDate = photo.PhotoDate,
            UploadedByUserId = photo.UploadedByUserId,
            UploadedByName = user.FullName,
            CreatedAt = photo.CreatedAt
        };
    }

    public async Task<List<PhotoDto>> GetPhotosAsync(Guid projectId, bool onlyCustomerVisible = false)
    {
        var projectExists = await _context.Projects.AnyAsync(p => p.Id == projectId);
        if (!projectExists)
            throw new KeyNotFoundException("Loyiha topilmadi.");

        var query = _context.Photos
            .Include(p => p.Stage)
            .Include(p => p.UploadedByUser)
            .Where(p => p.ProjectId == projectId);

        if (onlyCustomerVisible)
        {
            query = query.Where(p => p.IsVisibleToCustomer);
        }

        var photos = await query
            .OrderByDescending(p => p.PhotoDate)
            .ToListAsync();

        return photos.Select(p => new PhotoDto
        {
            Id = p.Id,
            ProjectId = p.ProjectId,
            StageId = p.StageId,
            StageName = p.Stage?.Name,
            PhotoUrl = p.PhotoUrl,
            Caption = p.Caption,
            IsVisibleToCustomer = p.IsVisibleToCustomer,
            PhotoDate = p.PhotoDate,
            UploadedByUserId = p.UploadedByUserId,
            UploadedByName = p.UploadedByUser?.FullName ?? "",
            CreatedAt = p.CreatedAt
        }).ToList();
    }

    public async Task DeletePhotoAsync(Guid projectId, Guid photoId)
    {
        var photo = await _context.Photos
            .FirstOrDefaultAsync(p => p.Id == photoId && p.ProjectId == projectId);

        if (photo is null)
            throw new KeyNotFoundException("Foto topilmadi.");

        _context.Photos.Remove(photo);
        await _context.SaveChangesAsync();
    }

    // Updates
    public async Task<ProjectUpdateDto> AddUpdateAsync(Guid projectId, CreateProjectUpdateDto dto, Guid createdByUserId)
    {
        var project = await _context.Projects.FindAsync(projectId);
        if (project is null)
            throw new KeyNotFoundException("Loyiha topilmadi.");

        var user = await _context.Users.FindAsync(createdByUserId);
        if (user is null)
            throw new KeyNotFoundException("Foydalanuvchi topilmadi.");

        if (dto.StageId.HasValue)
        {
            var stageExists = await _context.ProjectStages
                .AnyAsync(s => s.Id == dto.StageId.Value && s.ProjectId == projectId);
            if (!stageExists)
                throw new KeyNotFoundException("Bosqich topilmadi.");
        }

        var update = new ProjectUpdate
        {
            ProjectId = projectId,
            StageId = dto.StageId,
            Message = dto.Message.Trim(),
            IsVisibleToCustomer = dto.IsVisibleToCustomer,
            CreatedByUserId = createdByUserId,
            CreatedAt = DateTime.UtcNow
        };

        _context.ProjectUpdates.Add(update);
        await _context.SaveChangesAsync();

        var stage = dto.StageId.HasValue ? await _context.ProjectStages.FindAsync(dto.StageId.Value) : null;

        return new ProjectUpdateDto
        {
            Id = update.Id,
            ProjectId = update.ProjectId,
            StageId = update.StageId,
            StageName = stage?.Name,
            Message = update.Message,
            IsVisibleToCustomer = update.IsVisibleToCustomer,
            CreatedByUserId = update.CreatedByUserId,
            CreatedByName = user.FullName,
            CreatedAt = update.CreatedAt
        };
    }

    public async Task<List<ProjectUpdateDto>> GetUpdatesAsync(Guid projectId, bool onlyCustomerVisible = false)
    {
        var projectExists = await _context.Projects.AnyAsync(p => p.Id == projectId);
        if (!projectExists)
            throw new KeyNotFoundException("Loyiha topilmadi.");

        var query = _context.ProjectUpdates
            .Include(u => u.Stage)
            .Include(u => u.CreatedByUser)
            .Where(u => u.ProjectId == projectId);

        if (onlyCustomerVisible)
        {
            query = query.Where(u => u.IsVisibleToCustomer);
        }

        var updates = await query
            .OrderByDescending(u => u.CreatedAt)
            .ToListAsync();

        return updates.Select(u => new ProjectUpdateDto
        {
            Id = u.Id,
            ProjectId = u.ProjectId,
            StageId = u.StageId,
            StageName = u.Stage?.Name,
            Message = u.Message,
            IsVisibleToCustomer = u.IsVisibleToCustomer,
            CreatedByUserId = u.CreatedByUserId,
            CreatedByName = u.CreatedByUser?.FullName ?? "",
            CreatedAt = u.CreatedAt
        }).ToList();
    }

    public async Task DeleteUpdateAsync(Guid projectId, Guid updateId)
    {
        var update = await _context.ProjectUpdates
            .FirstOrDefaultAsync(u => u.Id == updateId && u.ProjectId == projectId);

        if (update is null)
            throw new KeyNotFoundException("Yangilanish topilmadi.");

        _context.ProjectUpdates.Remove(update);
        await _context.SaveChangesAsync();
    }
}

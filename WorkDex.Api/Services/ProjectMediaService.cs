using Microsoft.EntityFrameworkCore;
using WorkDex.Api.Data;
using WorkDex.Api.DTOs.Documents;
using WorkDex.Api.DTOs.Photos;
using WorkDex.Api.DTOs.Updates;
using WorkDex.Api.Models;

namespace WorkDex.Api.Services;

public class ProjectMediaService : IProjectMediaService
{
    private const long MaxDocumentSizeBytes = 25 * 1024 * 1024;
    private static readonly HashSet<string> AllowedDocumentExtensions = new(StringComparer.OrdinalIgnoreCase)
    {
        ".pdf", ".docx", ".xlsx", ".png", ".jpg", ".jpeg", ".webp"
    };

    private readonly AppDbContext _context;
    private readonly IWebHostEnvironment _env;

    public ProjectMediaService(AppDbContext context, IWebHostEnvironment env)
    {
        _context = context;
        _env = env;
    }

    public async Task<DocumentDto> UploadDocumentAsync(Guid projectId, IFormFile file, string? title, string? fileType, Guid uploadedByUserId)
    {
        if (file == null || file.Length == 0)
            throw new ArgumentException("Fayl tanlanmagan.");
        if (file.Length > MaxDocumentSizeBytes)
            throw new ArgumentException("Fayl hajmi 25 MB dan oshmasligi kerak.");

        var ext = Path.GetExtension(file.FileName);
        if (!AllowedDocumentExtensions.Contains(ext))
            throw new ArgumentException("Faqat PDF, DOCX, XLSX, PNG, JPG yoki WEBP fayllariga ruxsat beriladi.");
        if (!await HasExpectedSignatureAsync(file, ext))
            throw new ArgumentException("Fayl kengaytmasi uning tarkibiga mos kelmaydi.");

        var project = await _context.Projects.FindAsync(projectId);
        if (project is null)
            throw new KeyNotFoundException("Loyiha topilmadi.");

        var user = await _context.Users.FindAsync(uploadedByUserId);
        if (user is null)
            throw new KeyNotFoundException("Foydalanuvchi topilmadi.");

        var folder = Path.Combine(_env.ContentRootPath, "App_Data", "uploads", "documents", projectId.ToString());
        Directory.CreateDirectory(folder);
        var safeFileName = $"{Guid.NewGuid():N}{ext.ToLowerInvariant()}";
        var fullPath = Path.Combine(folder, safeFileName);

        await using (var stream = new FileStream(fullPath, FileMode.CreateNew, FileAccess.Write, FileShare.None))
        {
            await file.CopyToAsync(stream);
        }

        var relativePath = $"/uploads/documents/{projectId}/{safeFileName}";
        var finalTitle = !string.IsNullOrWhiteSpace(title) ? title.Trim() : Path.GetFileNameWithoutExtension(file.FileName);
        var finalType = !string.IsNullOrWhiteSpace(fileType)
            ? fileType.Trim()
            : ext.TrimStart('.').ToLowerInvariant();

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
            FilePath = GetClientFilePath(doc),
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
            FilePath = GetClientFilePath(doc),
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
            FilePath = GetClientFilePath(d),
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

        var diskPath = ResolveUploadedDocumentPath(projectId, doc.FilePath);
        if (diskPath is not null && File.Exists(diskPath))
            File.Delete(diskPath);

        _context.Documents.Remove(doc);
        await _context.SaveChangesAsync();
    }

    public async Task<(string FullPath, string FileName)?> GetDocumentFileAsync(Guid projectId, Guid documentId)
    {
        var document = await _context.Documents
            .AsNoTracking()
            .FirstOrDefaultAsync(d => d.Id == documentId && d.ProjectId == projectId);
        if (document is null)
            return null;

        var fullPath = ResolveUploadedDocumentPath(projectId, document.FilePath);
        if (fullPath is null || !File.Exists(fullPath))
            return null;

        var extension = Path.GetExtension(fullPath);
        var title = string.Concat(document.Title.Select(character =>
            char.IsLetterOrDigit(character) || character is ' ' or '-' or '_' ? character : '_')).Trim();
        if (string.IsNullOrWhiteSpace(title))
            title = "hujjat";

        return (fullPath, $"{title}{extension}");
    }

    private string? ResolveUploadedDocumentPath(Guid projectId, string filePath)
    {
        var normalizedPath = filePath.Replace('\\', '/').TrimStart('/');
        var expectedPrefix = $"uploads/documents/{projectId:D}/";
        if (!normalizedPath.StartsWith(expectedPrefix, StringComparison.OrdinalIgnoreCase))
            return null;

        var fileName = normalizedPath[expectedPrefix.Length..];
        if (string.IsNullOrWhiteSpace(fileName)
            || fileName is "." or ".."
            || Path.GetFileName(fileName) != fileName
            || fileName.IndexOfAny(['/', '\\']) >= 0)
        {
            return null;
        }

        var privatePath = Path.Combine(_env.ContentRootPath, "App_Data", "uploads", "documents", projectId.ToString(), fileName);
        if (File.Exists(privatePath))
            return privatePath;

        var legacyRoot = _env.WebRootPath ?? Path.Combine(_env.ContentRootPath, "wwwroot");
        var legacyPath = Path.Combine(legacyRoot, "uploads", "documents", projectId.ToString(), fileName);
        return File.Exists(legacyPath) ? legacyPath : null;
    }

    private static string GetClientFilePath(ProjectDocument document)
    {
        if (document.FilePath.Replace('\\', '/').StartsWith("/uploads/documents/", StringComparison.OrdinalIgnoreCase))
            return $"/api/projects/{document.ProjectId}/documents/{document.Id}/file";
        return document.FilePath;
    }

    private static async Task<bool> HasExpectedSignatureAsync(IFormFile file, string extension)
    {
        var header = new byte[12];
        await using var stream = file.OpenReadStream();
        var bytesRead = await stream.ReadAsync(header);

        return extension.ToLowerInvariant() switch
        {
            ".pdf" => bytesRead >= 5 && header.AsSpan(0, 5).SequenceEqual("%PDF-"u8),
            ".png" => bytesRead >= 8 && header.AsSpan(0, 8).SequenceEqual(new byte[] { 0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A }),
            ".jpg" or ".jpeg" => bytesRead >= 3 && header[0] == 0xFF && header[1] == 0xD8 && header[2] == 0xFF,
            ".webp" => bytesRead >= 12
                && header.AsSpan(0, 4).SequenceEqual("RIFF"u8)
                && header.AsSpan(8, 4).SequenceEqual("WEBP"u8),
            ".docx" or ".xlsx" => bytesRead >= 4 && header.AsSpan(0, 4).SequenceEqual(new byte[] { 0x50, 0x4B, 0x03, 0x04 }),
            _ => false
        };
    }

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

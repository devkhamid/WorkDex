namespace WorkDex.Api.Models;

// PDF §14 — Shartnoma, chek, hisob-faktura va chizmalar
public class ProjectDocument
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid ProjectId { get; set; }

    public string Title { get; set; } = string.Empty;
    public string FilePath { get; set; } = string.Empty; // Fayl yo'li yoki URL
    public string? FileType { get; set; } // pdf, docx, img...
    public long FileSizeBytes { get; set; }

    public Guid UploadedByUserId { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public Project Project { get; set; } = null!;
    public User UploadedByUser { get; set; } = null!;
}

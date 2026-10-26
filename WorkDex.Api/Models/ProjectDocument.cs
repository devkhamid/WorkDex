namespace WorkDex.Api.Models;

public class ProjectDocument
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid ProjectId { get; set; }

    public string Title { get; set; } = string.Empty;
    public string FilePath { get; set; } = string.Empty;    public string? FileType { get; set; }    public long FileSizeBytes { get; set; }

    public Guid UploadedByUserId { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public Project Project { get; set; } = null!;
    public User UploadedByUser { get; set; } = null!;
}

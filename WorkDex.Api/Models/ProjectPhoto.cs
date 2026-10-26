namespace WorkDex.Api.Models;

public class ProjectPhoto
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid ProjectId { get; set; }
    public Guid? StageId { get; set; }
    public string PhotoUrl { get; set; } = string.Empty;
    public string? Caption { get; set; }    public bool IsVisibleToCustomer { get; set; } = true;    public DateTime PhotoDate { get; set; } = DateTime.UtcNow;

    public Guid UploadedByUserId { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public Project Project { get; set; } = null!;
    public ProjectStage? Stage { get; set; }
    public User UploadedByUser { get; set; } = null!;
}

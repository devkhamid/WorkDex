namespace WorkDex.Api.Models;

public class ProjectUpdate
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid ProjectId { get; set; }
    public Guid? StageId { get; set; }

    public string Message { get; set; } = string.Empty;    public bool IsVisibleToCustomer { get; set; } = true;

    public Guid CreatedByUserId { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public Project Project { get; set; } = null!;
    public ProjectStage? Stage { get; set; }
    public User CreatedByUser { get; set; } = null!;
}

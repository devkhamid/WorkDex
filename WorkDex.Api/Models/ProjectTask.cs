namespace WorkDex.Api.Models;

// PDF §8, §14 va §15 — Loyihaga tegishli vazifalar va progress hisobi
public class ProjectTask
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid ProjectId { get; set; }
    public Guid? StageId { get; set; } // Qaysi bosqichga tegishli (Demontaj, Qurilish va h.k.)

    public string Title { get; set; } = string.Empty;
    public string? Description { get; set; }
    public Guid? AssignedToUserId { get; set; } // Biriktirilgan xodim

    public int Weight { get; set; } = 1; // Vazifa og'irligi (PDF §15 progress formulasi uchun)
    public bool IsCompleted { get; set; } = false;
    public DateTime? CompletedAt { get; set; }
    public DateTime? DueDate { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public Project Project { get; set; } = null!;
    public ProjectStage? Stage { get; set; }
    public User? AssignedToUser { get; set; }
}

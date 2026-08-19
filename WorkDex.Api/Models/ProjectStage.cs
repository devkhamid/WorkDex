namespace WorkDex.Api.Models;

// PDF §8 da keltirilgan bosqichlar:
// Tekshiruv, Demontaj, Qurilish, Elektr, Suvoq/gips, Pol/kafel, Bo'yoq, Topshirish va h.k.
public class ProjectStage
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid ProjectId { get; set; }

    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }

    public int OrderIndex { get; set; }

    public bool IsCompleted { get; set; } = false;
    public DateTime? CompletedAt { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public Project Project { get; set; } = null!;
    public ICollection<ProjectTask> Tasks { get; set; } = new List<ProjectTask>();
    public ICollection<ProjectPhoto> Photos { get; set; } = new List<ProjectPhoto>();
    public ICollection<ProjectUpdate> Updates { get; set; } = new List<ProjectUpdate>();
}

namespace WorkDex.Api.Models;

// PDF §12 va §14 — Saha xodimi loyiha bo'yicha kiritadigan yangilanish xabarlari
public class ProjectUpdate
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid ProjectId { get; set; }
    public Guid? StageId { get; set; }

    public string Message { get; set; } = string.Empty; // "Oshxona kafel ishlari boshlandi", "Bugun 2-qavat elektr simlari tortildi"
    public bool IsVisibleToCustomer { get; set; } = true;

    public Guid CreatedByUserId { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public Project Project { get; set; } = null!;
    public ProjectStage? Stage { get; set; }
    public User CreatedByUser { get; set; } = null!;
}

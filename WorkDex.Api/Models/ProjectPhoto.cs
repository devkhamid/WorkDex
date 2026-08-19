namespace WorkDex.Api.Models;

// PDF §12 va §14 — Loyiha fotosuratlari (Oldin / Keyin, kunlik/haftalik progress)
public class ProjectPhoto
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid ProjectId { get; set; }
    public Guid? StageId { get; set; } // Muayyan ish bosqichining fotosurati

    public string PhotoUrl { get; set; } = string.Empty;
    public string? Caption { get; set; } // Tavsif / Izoh
    public bool IsVisibleToCustomer { get; set; } = true; // Mijozga ko'rinsinmi yoki faqat ichki
    public DateTime PhotoDate { get; set; } = DateTime.UtcNow;

    public Guid UploadedByUserId { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public Project Project { get; set; } = null!;
    public ProjectStage? Stage { get; set; }
    public User UploadedByUser { get; set; } = null!;
}

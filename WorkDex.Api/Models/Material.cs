namespace WorkDex.Api.Models;

// PDF §5 — Materiallar katalogi
public class Material
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public string Name { get; set; } = string.Empty;
    public string Unit { get; set; } = string.Empty; // kg, dona, m², m³, metr, litr
    public string? Description { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public ICollection<MaterialPurchase> Purchases { get; set; } = new List<MaterialPurchase>();
}

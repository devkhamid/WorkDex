namespace WorkDex.Api.Models;

public class Material
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public string Name { get; set; } = string.Empty;
    public string? Brand { get; set; }    public string Unit { get; set; } = string.Empty;    public string? Description { get; set; }
    public Guid? CompanyAdminId { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public ICollection<MaterialPurchase> Purchases { get; set; } = new List<MaterialPurchase>();
}

using System.ComponentModel.DataAnnotations;

namespace WorkDex.Api.DTOs.Materials;

public class CreateMaterialDto
{
    [Required]
    [MaxLength(200)]
    public string Name { get; set; } = string.Empty;

    [MaxLength(200)]
    public string? Brand { get; set; } // Brend / ishlab chiqaruvchi

    [Required]
    [MaxLength(50)]
    public string Unit { get; set; } = string.Empty; // kg, dona, m², m³, metr, litr

    [MaxLength(1000)]
    public string? Description { get; set; }
}

public class MaterialDto
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Brand { get; set; }
    public string Unit { get; set; } = string.Empty;
    public string? Description { get; set; }
    public int PurchaseCount { get; set; } // Nechta xaridda ishlatilgan
    public DateTime CreatedAt { get; set; }
}

public class MergeMaterialDto
{
    [Required]
    public Guid TargetId { get; set; }
}

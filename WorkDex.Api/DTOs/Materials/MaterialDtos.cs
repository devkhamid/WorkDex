using System.ComponentModel.DataAnnotations;
using Microsoft.AspNetCore.Http;

namespace WorkDex.Api.DTOs.Materials;

public class CreateMaterialDto
{
    [Required]
    [MaxLength(200)]
    public string Name { get; set; } = string.Empty;

    [MaxLength(200)]
    public string? Brand { get; set; }
    [Required]
    [MaxLength(50)]
    public string Unit { get; set; } = string.Empty;
    [MaxLength(100)]
    public string? Category { get; set; }
    [MaxLength(1000)]
    public string? Description { get; set; }
}

public class MaterialDto
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Brand { get; set; }
    public string Unit { get; set; } = string.Empty;
    public string? Category { get; set; }
    public string? Description { get; set; }
    public int PurchaseCount { get; set; }    public DateTime CreatedAt { get; set; }
}

public class MergeMaterialDto
{
    [Required]
    public Guid TargetId { get; set; }
}

public class ImportMaterialsDto
{
    [Required]
    public IFormFile File { get; set; } = null!;
}

public class MaterialImportIssueDto
{
    public int Row { get; set; }
    public string? Name { get; set; }
    public string Message { get; set; } = string.Empty;
}

public class MaterialImportResultDto
{
    public int TotalRows { get; set; }
    public int Created { get; set; }
    public List<MaterialImportIssueDto> Skipped { get; set; } = new();
    public List<MaterialImportIssueDto> Errors { get; set; } = new();
}

using System.ComponentModel.DataAnnotations;
using WorkDex.Api.Models;

namespace WorkDex.Api.DTOs.Projects;

public class UpdateProjectDto
{
    [Required]
    [MaxLength(300)]
    public string Name { get; set; } = string.Empty;

    [MaxLength(2000)]
    public string? Description { get; set; }

    [MaxLength(200)]
    public string? ProjectType { get; set; }

    [Required]
    public Guid CustomerId { get; set; }

    [Required]
    [Range(0, double.MaxValue)]
    public decimal ContractAmount { get; set; }

    [Required]
    [Range(0, double.MaxValue)]
    public decimal Budget { get; set; }

    [MaxLength(10)]
    public string Currency { get; set; } = "USD";

    [Required]
    public DateTime StartDate { get; set; }

    public DateTime? EndDate { get; set; }
    public DateTime? ActualEndDate { get; set; }

    [MaxLength(500)]
    public string? Location { get; set; }

    [MaxLength(2000)]
    public string? Notes { get; set; }
}

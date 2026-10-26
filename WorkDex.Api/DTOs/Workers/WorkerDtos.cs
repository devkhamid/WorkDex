using System.ComponentModel.DataAnnotations;

namespace WorkDex.Api.DTOs.Workers;

public class CreateWorkerDto
{
    [Required]
    [MaxLength(200)]
    public string FullName { get; set; } = string.Empty;

    [Required]
    [MaxLength(20)]
    public string PhoneNumber { get; set; } = string.Empty;

    [MaxLength(200)]
    public string? Specialty { get; set; }
    [MaxLength(1000)]
    public string? Notes { get; set; }
}

public class WorkerDto
{
    public Guid Id { get; set; }
    public string FullName { get; set; } = string.Empty;
    public string PhoneNumber { get; set; } = string.Empty;
    public string? Specialty { get; set; }
    public string? Notes { get; set; }
    public DateTime CreatedAt { get; set; }
}

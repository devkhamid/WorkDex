using System.ComponentModel.DataAnnotations;

namespace WorkDex.Api.DTOs.Updates;

public class CreateProjectUpdateDto
{
    public Guid? StageId { get; set; }

    [Required]
    [MaxLength(2000)]
    public string Message { get; set; } = string.Empty;

    public bool IsVisibleToCustomer { get; set; } = true;
}

public class ProjectUpdateDto
{
    public Guid Id { get; set; }
    public Guid ProjectId { get; set; }
    public Guid? StageId { get; set; }
    public string? StageName { get; set; }
    public string Message { get; set; } = string.Empty;
    public bool IsVisibleToCustomer { get; set; }
    public Guid CreatedByUserId { get; set; }
    public string CreatedByName { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
}

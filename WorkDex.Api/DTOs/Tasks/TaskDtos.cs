using System.ComponentModel.DataAnnotations;

namespace WorkDex.Api.DTOs.Tasks;

public class CreateTaskDto
{
    [Required]
    [MaxLength(300)]
    public string Title { get; set; } = string.Empty;

    [MaxLength(2000)]
    public string? Description { get; set; }

    public Guid? StageId { get; set; }
    public Guid? AssignedToUserId { get; set; }

    [Range(1, 100, ErrorMessage = "Vazifa og'irligi 1 dan 100 gacha bo'lishi kerak.")]
    public int Weight { get; set; } = 1;

    public DateTime? DueDate { get; set; }
}

public class UpdateTaskDto
{
    [Required]
    [MaxLength(300)]
    public string Title { get; set; } = string.Empty;

    [MaxLength(2000)]
    public string? Description { get; set; }

    public Guid? StageId { get; set; }
    public Guid? AssignedToUserId { get; set; }

    [Range(1, 100)]
    public int Weight { get; set; } = 1;

    public bool IsCompleted { get; set; }
    public DateTime? DueDate { get; set; }
}

public class TaskDto
{
    public Guid Id { get; set; }
    public Guid ProjectId { get; set; }
    public Guid? StageId { get; set; }
    public string? StageName { get; set; }
    public string Title { get; set; } = string.Empty;
    public string? Description { get; set; }
    public Guid? AssignedToUserId { get; set; }
    public string? AssignedToUserName { get; set; }
    public int Weight { get; set; }
    public bool IsCompleted { get; set; }
    public DateTime? CompletedAt { get; set; }
    public DateTime? DueDate { get; set; }
    public DateTime CreatedAt { get; set; }
}

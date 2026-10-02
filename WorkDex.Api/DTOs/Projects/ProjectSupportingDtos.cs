using System.ComponentModel.DataAnnotations;
using WorkDex.Api.Models;

namespace WorkDex.Api.DTOs.Projects;

public class UpdateProjectStatusDto
{
    [Required]
    public ProjectStatus Status { get; set; }
}

public class RenameProjectDto
{
    [Required]
    [MaxLength(300)]
    public string Name { get; set; } = string.Empty;
}

public class AddProjectMemberDto
{
    [Required]
    public Guid UserId { get; set; }

    [Required]
    public UserRole RoleInProject { get; set; }
}

public class ProjectMemberDto
{
    public Guid UserId { get; set; }
    public string FullName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public UserRole RoleInProject { get; set; }
    public string RoleName { get; set; } = string.Empty;
    public DateTime AssignedAt { get; set; }
}

public class CreateProjectStageDto
{
    [Required]
    [MaxLength(200)]
    public string Name { get; set; } = string.Empty;

    [MaxLength(1000)]
    public string? Description { get; set; }

    [Required]
    [Range(1, 100)]
    public int OrderIndex { get; set; }
}

public class ProjectStageDto
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public int OrderIndex { get; set; }
    public bool IsCompleted { get; set; }
    public DateTime? CompletedAt { get; set; }
    public DateTime CreatedAt { get; set; }
}

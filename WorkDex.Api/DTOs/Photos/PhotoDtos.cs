using System.ComponentModel.DataAnnotations;

namespace WorkDex.Api.DTOs.Photos;

public class CreatePhotoDto
{
    public Guid? StageId { get; set; }

    [Required]
    [MaxLength(1000)]
    public string PhotoUrl { get; set; } = string.Empty;

    [MaxLength(1000)]
    public string? Caption { get; set; }

    public bool IsVisibleToCustomer { get; set; } = true;

    public DateTime PhotoDate { get; set; } = DateTime.UtcNow;
}

public class PhotoDto
{
    public Guid Id { get; set; }
    public Guid ProjectId { get; set; }
    public Guid? StageId { get; set; }
    public string? StageName { get; set; }
    public string PhotoUrl { get; set; } = string.Empty;
    public string? Caption { get; set; }
    public bool IsVisibleToCustomer { get; set; }
    public DateTime PhotoDate { get; set; }
    public Guid UploadedByUserId { get; set; }
    public string UploadedByName { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
}

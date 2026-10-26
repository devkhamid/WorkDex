using System.ComponentModel.DataAnnotations;
using WorkDex.Api.Models;

namespace WorkDex.Api.DTOs.Users;

public class UpdateUserDto
{
    [Required]
    [MaxLength(100)]
    public string FirstName { get; set; } = string.Empty;

    [Required]
    [MaxLength(100)]
    public string LastName { get; set; } = string.Empty;

    [MaxLength(20)]
    public string? PhoneNumber { get; set; }

    [EmailAddress]
    [MaxLength(200)]
    public string? Email { get; set; }

    public UserRole Role { get; set; }
}

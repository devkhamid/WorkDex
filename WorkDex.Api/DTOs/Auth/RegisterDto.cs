using System.ComponentModel.DataAnnotations;
using WorkDex.Api.Models;

namespace WorkDex.Api.DTOs.Auth;

public class RegisterDto
{
    [Required]
    [MaxLength(100)]
    public string FirstName { get; set; } = string.Empty;

    [Required]
    [MaxLength(100)]
    public string LastName { get; set; } = string.Empty;

    [Required]
    [EmailAddress]
    [MaxLength(200)]
    public string Email { get; set; } = string.Empty;

    [Required]
    [MinLength(6)]
    public string Password { get; set; } = string.Empty;

    [MaxLength(20)]
    public string? PhoneNumber { get; set; }

    [MaxLength(200)]
    public string? CompanyName { get; set; }

    public UserRole Role { get; set; } = UserRole.FieldWorker;
}

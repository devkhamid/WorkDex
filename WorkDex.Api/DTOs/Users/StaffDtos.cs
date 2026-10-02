using System.ComponentModel.DataAnnotations;
using WorkDex.Api.DTOs.Tasks;
using WorkDex.Api.Models;

namespace WorkDex.Api.DTOs.Users;

// Xodimlar sahifasi uchun: foydalanuvchi + unga biriktirilgan vazifalar statistikasi
public class StaffMemberDto : UserDto
{
    public bool IsCompanyOwner { get; set; }
    public int OpenTaskCount { get; set; }
    public int CompletedTaskCount { get; set; }
    public int OverdueTaskCount { get; set; }
}

public class StaffTaskDto : TaskDto
{
    public string ProjectName { get; set; } = string.Empty;
    public ProjectStatus ProjectStatus { get; set; }
}

public class ResetPasswordDto
{
    [Required]
    [MinLength(6)]
    public string NewPassword { get; set; } = string.Empty;
}

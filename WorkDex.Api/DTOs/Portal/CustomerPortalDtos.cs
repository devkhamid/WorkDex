using WorkDex.Api.Models;

namespace WorkDex.Api.DTOs.Portal;

// PDF §13 — Mijoz uchun maxsus toza ko'rinish (ichki usta/material xarajatlari yashirin)
public class CustomerPortalProjectDto
{
    public Guid ProjectId { get; set; }
    public string ProjectName { get; set; } = string.Empty;
    public string? ProjectType { get; set; }
    public string? Location { get; set; }
    public DateTime StartDate { get; set; }
    public DateTime? EndDate { get; set; }
    public ProjectStatus Status { get; set; }
    public string StatusName { get; set; } = string.Empty;
    public decimal ProgressPercent { get; set; }

    // Mijoz hisob-kitoblari
    public decimal ContractAmount { get; set; }
    public decimal TotalPaid { get; set; }
    public decimal RemainingPayment { get; set; }
    public string Currency { get; set; } = "USD";

    // Alohida bo'limlar
    public List<CustomerPortalStageDto> Stages { get; set; } = new();
    public List<CustomerPortalPhotoDto> Photos { get; set; } = new();
    public List<CustomerPortalUpdateDto> Updates { get; set; } = new();
    public List<CustomerPortalExtraWorkDto> ApprovedExtraWorks { get; set; } = new();
}

public class CustomerPortalStageDto
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public int OrderIndex { get; set; }
    public bool IsCompleted { get; set; }
    public DateTime? CompletedAt { get; set; }
}

public class CustomerPortalPhotoDto
{
    public Guid Id { get; set; }
    public string? StageName { get; set; }
    public string PhotoUrl { get; set; } = string.Empty;
    public string? Caption { get; set; }
    public DateTime PhotoDate { get; set; }
}

public class CustomerPortalUpdateDto
{
    public Guid Id { get; set; }
    public string? StageName { get; set; }
    public string Message { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
}

public class CustomerPortalExtraWorkDto
{
    public Guid Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string? Description { get; set; }
    public decimal Amount { get; set; }
    public DateTime? ApprovedAt { get; set; }
}

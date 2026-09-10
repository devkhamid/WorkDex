using WorkDex.Api.Models;

namespace WorkDex.Api.DTOs.Projects;

public class ProjectDto
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string? ProjectType { get; set; }
    public Guid CustomerId { get; set; }
    public string CustomerName { get; set; } = string.Empty;
    public decimal ContractAmount { get; set; }
    public decimal Budget { get; set; }
    public string Currency { get; set; } = "USD";
    public DateTime StartDate { get; set; }
    public DateTime? EndDate { get; set; }
    public DateTime? ActualEndDate { get; set; }
    public ProjectStatus Status { get; set; }
    public string StatusName { get; set; } = string.Empty;
    public decimal ProgressPercent { get; set; }
    public string? Location { get; set; }
    public string? Notes { get; set; }
    public Guid CreatedByUserId { get; set; }
    public string CreatedByName { get; set; } = string.Empty;
    public int MemberCount { get; set; }
    public int StageCount { get; set; }
    public int CompletedStageCount { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }

    // Shartnomadan kelgan maydonlar
    public string? Block { get; set; }
    public string? ApartmentNumber { get; set; }
    public decimal? AreaM2 { get; set; }
    public int PrepaymentPercent { get; set; } = 30;
    public int IntermediatePercent { get; set; } = 50;
    public int FinalPercent { get; set; } = 20;
    public decimal? ExchangeRate { get; set; }
    public Guid? AgreementId { get; set; }
}

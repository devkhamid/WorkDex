namespace WorkDex.Api.Models;

public class Agreement
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public int ContractNumber { get; set; }
    public int Day { get; set; }
    public int Month { get; set; }
    public int Year { get; set; }
    public string ProjectName { get; set; } = string.Empty;

    public Guid? CustomerId { get; set; }
    public Customer? Customer { get; set; }

    public string? ObjectAddress { get; set; }
    public string? Block { get; set; }
    public string? ApartmentNumber { get; set; }
    public decimal? AreaM2 { get; set; }

    public decimal TotalAmountUZS { get; set; }
    public int PrepaymentPercent { get; set; } = 30;
    public int IntermediatePercent { get; set; } = 50;
    public int FinalPercent { get; set; } = 20;

    public decimal? ExchangeRate { get; set; }
    public Guid? ProjectId { get; set; }
    public Project? Project { get; set; }

    public AgreementStatus Status { get; set; } = AgreementStatus.Draft;
    public Guid? CompanyAdminId { get; set; }
    public Guid CreatedByUserId { get; set; }
    public User CreatedByUser { get; set; } = null!;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}

public enum AgreementStatus
{
    Draft = 1,
    Active = 2,
    ProjectCreated = 3
}

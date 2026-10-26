namespace WorkDex.Api.Models;

public class Project
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }

    public string? ProjectType { get; set; }

    public Guid CustomerId { get; set; }
    public decimal ContractAmount { get; set; }
    public decimal Budget { get; set; }
    public string Currency { get; set; } = "USD";
    public DateTime StartDate { get; set; }
    public DateTime? EndDate { get; set; }
    public DateTime? ActualEndDate { get; set; }
    public ProjectStatus Status { get; set; } = ProjectStatus.Planning;
    public decimal ProgressPercent { get; set; } = 0;
    public string? Location { get; set; }
    public string? Notes { get; set; }
    public Guid CreatedByUserId { get; set; }
    public Guid? CompanyAdminId { get; set; }

    public string? Block { get; set; }
    public string? ApartmentNumber { get; set; }
    public decimal? AreaM2 { get; set; }
    public int PrepaymentPercent { get; set; } = 30;
    public int IntermediatePercent { get; set; } = 50;
    public int FinalPercent { get; set; } = 20;
    public decimal? ExchangeRate { get; set; }
    public decimal? ContractAmountUzs { get; set; }    public Guid? AgreementId { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    public Customer Customer { get; set; } = null!;
    public User CreatedByUser { get; set; } = null!;
    public ICollection<ProjectMember> Members { get; set; } = new List<ProjectMember>();
    public ICollection<ProjectStage> Stages { get; set; } = new List<ProjectStage>();
    public ICollection<MaterialPurchase> MaterialPurchases { get; set; } = new List<MaterialPurchase>();
    public ICollection<WorkerPayment> WorkerPayments { get; set; } = new List<WorkerPayment>();
    public ICollection<ExtraWork> ExtraWorks { get; set; } = new List<ExtraWork>();
    public ICollection<ProjectTask> Tasks { get; set; } = new List<ProjectTask>();
    public ICollection<ProjectDocument> Documents { get; set; } = new List<ProjectDocument>();
    public ICollection<ProjectPhoto> Photos { get; set; } = new List<ProjectPhoto>();
    public ICollection<ProjectUpdate> Updates { get; set; } = new List<ProjectUpdate>();
}

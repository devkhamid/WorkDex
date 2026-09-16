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

    public string? ObjectAddress { get; set; } = "г. Ташкент, Яккасарайский район, улица, дом 133";
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

    public ClientType ClientType { get; set; } = ClientType.Individual;

    // Yuridik shaxs (Zakazchik) rekvizitlari
    public string? CompanyName { get; set; }
    public string? DirectorName { get; set; }
    public string? DirectorTitle { get; set; } = "Ген. директора";
    public string? FoundationDoc { get; set; } = "Устава";
    public string? LegalAddress { get; set; }
    public string? Inn { get; set; }
    public string? BankAccount { get; set; }
    public string? BankName { get; set; }
    public string? Mfo { get; set; }
    public string? SecondBankName { get; set; }
    public string? SecondBankAccount { get; set; }
    public string? SecondMfo { get; set; }
    public string? Oked { get; set; }
    public string? Okpo { get; set; }
    public string? NdsRegNumber { get; set; }

    // Podryadchik (Bajaruvchi firma) rekvizitlari
    public string? ContractorCompanyName { get; set; }
    public string? ContractorDirectorName { get; set; }
    public string? ContractorAddress { get; set; }
    public string? ContractorBankAccount { get; set; }
    public string? ContractorBankName { get; set; }
    public string? ContractorMfo { get; set; }
    public string? ContractorInn { get; set; }
    public string? ContractorPhone { get; set; }

    public AgreementStatus Status { get; set; } = AgreementStatus.Draft;
    public Guid? CompanyAdminId { get; set; }
    public Guid CreatedByUserId { get; set; }
    public User CreatedByUser { get; set; } = null!;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}

public enum ClientType
{
    Individual = 1,   // Jismoniy shaxs
    LegalEntity = 2   // Yuridik shaxs
}

public enum AgreementStatus
{
    Draft = 1,
    Active = 2,
    ProjectCreated = 3
}

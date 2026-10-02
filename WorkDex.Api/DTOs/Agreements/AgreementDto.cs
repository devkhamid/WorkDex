namespace WorkDex.Api.DTOs.Agreements;

public class AgreementDto
{
    public Guid Id { get; set; }
    public int ContractNumber { get; set; }
    public int Day { get; set; }
    public int Month { get; set; }
    public int Year { get; set; }
    public string ProjectName { get; set; } = string.Empty;

    public Guid? CustomerId { get; set; }
    public string? CustomerFullName { get; set; }
    public string? CustomerPhone { get; set; }
    public string? CustomerPassportSeries { get; set; }
    public string? CustomerAddress { get; set; }

    public string? ObjectAddress { get; set; }
    public string? Block { get; set; }
    public string? ApartmentNumber { get; set; }
    public decimal? AreaM2 { get; set; }

    public decimal TotalAmountUZS { get; set; }
    public int PrepaymentPercent { get; set; }
    public int IntermediatePercent { get; set; }
    public int FinalPercent { get; set; }

    public int ClientType { get; set; } = 1; // 1 = Individual, 2 = LegalEntity
    public string ClientTypeName { get; set; } = "Individual";

    // Yuridik shaxs (Zakazchik) rekvizitlari
    public string? CompanyName { get; set; }
    public string? DirectorName { get; set; }
    public string? DirectorTitle { get; set; }
    public string? FoundationDoc { get; set; }
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

    public decimal? ExchangeRate { get; set; }
    public Guid? ProjectId { get; set; }
    public string Status { get; set; } = "Draft";
    public int StatusCode { get; set; }
    public Guid? CompanyAdminId { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}

public class CreateAgreementDto
{
    public int ContractNumber { get; set; }
    public int Day { get; set; }
    public int Month { get; set; }
    public int Year { get; set; }
    public string ProjectName { get; set; } = string.Empty;

    public int ClientType { get; set; } = 1;

    // Jismoniy shaxs
    public Guid? CustomerId { get; set; }
    public string? CustomerFullName { get; set; }
    public string? CustomerPassportSeries { get; set; }
    public string? CustomerAddress { get; set; }
    public string? CustomerPhone { get; set; }

    // Yuridik shaxs
    public string? CompanyName { get; set; }
    public string? DirectorName { get; set; }
    public string? DirectorTitle { get; set; }
    public string? FoundationDoc { get; set; }
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

    // Podryadchik rekvizitlari
    public string? ContractorCompanyName { get; set; }
    public string? ContractorDirectorName { get; set; }
    public string? ContractorAddress { get; set; }
    public string? ContractorBankAccount { get; set; }
    public string? ContractorBankName { get; set; }
    public string? ContractorMfo { get; set; }
    public string? ContractorInn { get; set; }
    public string? ContractorPhone { get; set; }

    public string? ObjectAddress { get; set; } = "г. Ташкент, Яккасарайский район, улица, дом 133";
    public string? Block { get; set; }
    public string? ApartmentNumber { get; set; }
    public decimal? AreaM2 { get; set; }

    public decimal TotalAmountUZS { get; set; }
    public int PrepaymentPercent { get; set; } = 30;
    public int IntermediatePercent { get; set; } = 50;
    public int FinalPercent { get; set; } = 20;
}

public class UpdateAgreementDto
{
    public int ContractNumber { get; set; }
    public int Day { get; set; }
    public int Month { get; set; }
    public int Year { get; set; }
    public string ProjectName { get; set; } = string.Empty;

    public int ClientType { get; set; } = 1;

    // Jismoniy shaxs
    public Guid? CustomerId { get; set; }
    public string? CustomerFullName { get; set; }
    public string? CustomerPassportSeries { get; set; }
    public string? CustomerAddress { get; set; }
    public string? CustomerPhone { get; set; }

    // Yuridik shaxs
    public string? CompanyName { get; set; }
    public string? DirectorName { get; set; }
    public string? DirectorTitle { get; set; }
    public string? FoundationDoc { get; set; }
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

    // Podryadchik rekvizitlari
    public string? ContractorCompanyName { get; set; }
    public string? ContractorDirectorName { get; set; }
    public string? ContractorAddress { get; set; }
    public string? ContractorBankAccount { get; set; }
    public string? ContractorBankName { get; set; }
    public string? ContractorMfo { get; set; }
    public string? ContractorInn { get; set; }
    public string? ContractorPhone { get; set; }

    public string? ObjectAddress { get; set; } = "г. Ташкент, Яккасарайский район, улица, дом 133";
    public string? Block { get; set; }
    public string? ApartmentNumber { get; set; }
    public decimal? AreaM2 { get; set; }

    public decimal TotalAmountUZS { get; set; }
    public int PrepaymentPercent { get; set; } = 30;
    public int IntermediatePercent { get; set; } = 50;
    public int FinalPercent { get; set; } = 20;
}

public class FinalizeAgreementDto
{
    // Kurs endi serverda CBU dan olinadi; eski klientlar uchun maydon qoldirilgan, lekin e'tiborga olinmaydi
    public decimal? ExchangeRate { get; set; }
    public DateTime? Deadline { get; set; }
    public List<Guid> ManagerIds { get; set; } = new();
}

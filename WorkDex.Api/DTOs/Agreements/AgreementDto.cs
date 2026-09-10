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

    public Guid? CustomerId { get; set; }
    public string? CustomerFullName { get; set; }
    public string? CustomerPassportSeries { get; set; }
    public string? CustomerAddress { get; set; }
    public string? CustomerPhone { get; set; }

    public string? ObjectAddress { get; set; }
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

    public Guid? CustomerId { get; set; }
    public string? CustomerFullName { get; set; }
    public string? CustomerPassportSeries { get; set; }
    public string? CustomerAddress { get; set; }
    public string? CustomerPhone { get; set; }

    public string? ObjectAddress { get; set; }
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
    public decimal ExchangeRate { get; set; }
    public DateTime? Deadline { get; set; }
    public List<Guid> ManagerIds { get; set; } = new();
}

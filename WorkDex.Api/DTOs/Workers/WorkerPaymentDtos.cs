using System.ComponentModel.DataAnnotations;

namespace WorkDex.Api.DTOs.Workers;

public class CreateWorkerPaymentDto
{
    [Required]
    public Guid WorkerId { get; set; }

    [Required]
    [MaxLength(500)]
    public string JobDescription { get; set; } = string.Empty;

    [Required]
    [Range(0, double.MaxValue, ErrorMessage = "Kelishilgan summa manfiy bo'lishi mumkin emas.")]
    public decimal AgreedAmount { get; set; }

    [Range(0, double.MaxValue, ErrorMessage = "Bajarilgan ish haqi manfiy bo'lishi mumkin emas.")]
    public decimal WorkAmount { get; set; } 

    [Range(0, double.MaxValue, ErrorMessage = "To'langan summa manfiy bo'lishi mumkin emas.")]
    public decimal PaidAmount { get; set; }

    public DateTime? PaymentDate { get; set; }

    [MaxLength(1000)]
    public string? Notes { get; set; }
}

public class UpdateWorkerWorkAmountDto
{
    [Required]
    [Range(0, double.MaxValue, ErrorMessage = "Bajarilgan ish haqi manfiy bo'lishi mumkin emas.")]
    public decimal WorkAmount { get; set; } 

    [MaxLength(1000)]
    public string? Notes { get; set; }
}

public class PayWorkerDto
{
    [Required]
    [Range(0.01, double.MaxValue, ErrorMessage = "To'lov summasi 0 dan katta bo'lishi kerak.")]
    public decimal Amount { get; set; }

    [Required]
    public DateTime PaymentDate { get; set; }

    [MaxLength(1000)]
    public string? Notes { get; set; }
}

public class WorkerPaymentDto
{
    public Guid Id { get; set; }
    public Guid ProjectId { get; set; }
    public Guid WorkerId { get; set; }
    public string WorkerName { get; set; } = string.Empty;
    public string? WorkerSpecialty { get; set; }
    public string JobDescription { get; set; } = string.Empty;
    public decimal AgreedAmount { get; set; }
    public decimal WorkAmount { get; set; } // Bajarilgan ish haqi
    public decimal PaidAmount { get; set; }
    public decimal RemainingAmount => AgreedAmount - PaidAmount; // Qoldiq qarz
    public decimal RemainingAllowedToPay => Math.Max(0, AgreedAmount - PaidAmount); // To'lanishi mumkin bo'lgan maksimal qoldiq
    public bool IsFullyPaid => AgreedAmount > 0 && PaidAmount >= AgreedAmount;
    public DateTime? PaymentDate { get; set; }
    public string? Notes { get; set; }
    public Guid CreatedByUserId { get; set; }
    public string CreatedByName { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
}

public class ProjectWorkerSummaryDto
{
    public Guid WorkerId { get; set; }
    public string WorkerName { get; set; } = string.Empty;
    public string? Specialty { get; set; }
    public decimal TotalAgreedAmount { get; set; }
    public decimal TotalWorkAmount { get; set; } // Jami bajarilgan ish haqi
    public decimal TotalPaidAmount { get; set; }
    public decimal RemainingAmount => TotalAgreedAmount - TotalPaidAmount;
    public decimal RemainingAllowedToPay => Math.Max(0, TotalAgreedAmount - TotalPaidAmount);
    public bool IsFullyPaid => TotalAgreedAmount > 0 && TotalPaidAmount >= TotalAgreedAmount;
    public int JobCount { get; set; }
}

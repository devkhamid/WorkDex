namespace WorkDex.Api.Models;

// PDF §6 va §14 — Ustaning loyihadagi ishi, hakedişi va to'lovlari
public class WorkerPayment
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid ProjectId { get; set; }
    public Guid WorkerId { get; set; }

    public string JobDescription { get; set; } = string.Empty; // Bajarilgan ish / vazifa
    public decimal AgreedAmount { get; set; } // Kelishilgan umumiy summa
    public decimal WorkAmount { get; set; } // Bajarilgan ish haqi summasi
    public decimal PaidAmount { get; set; } // Hozirgacha to'langan summa

    public DateTime? PaymentDate { get; set; }
    public string? Notes { get; set; }

    // Valyuta maydonlari
    public string Currency { get; set; } = "UZS"; // "UZS" yoki "USD"
    public decimal? ExchangeRateToUzs { get; set; } // Dollar kursi
    public decimal? OriginalAgreedAmount { get; set; } // Original valutadagi kelishilgan summa

    public Guid CreatedByUserId { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public Project Project { get; set; } = null!;
    public Worker Worker { get; set; } = null!;
    public User CreatedByUser { get; set; } = null!;
}

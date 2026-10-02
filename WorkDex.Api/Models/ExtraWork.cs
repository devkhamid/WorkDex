namespace WorkDex.Api.Models;

// PDF §7 va §14 — Qo'shimcha ishlar va qo'shimcha xarajatlar
public class ExtraWork
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid ProjectId { get; set; }

    public string Title { get; set; } = string.Empty; // Qo'shimcha ish nomi (masalan: Qo'shimcha xonani bo'yash)
    public string? Description { get; set; }
    public decimal CustomerAmount { get; set; } // Mijozga chiqarilgan narx (daromad)
    public decimal ActualCost { get; set; } // Haqiqiy tannarxi / xarajati

    // CustomerAmount va ActualCost har doim USD; kiritilgan valyuta va CBU kursi shu yerda
    public string Currency { get; set; } = "USD";
    public decimal? ExchangeRate { get; set; }
    public decimal? OriginalCustomerAmount { get; set; }
    public decimal? OriginalActualCost { get; set; }

    public bool IsApprovedByCustomer { get; set; } = false; // Mijoz tasdiqladimi?
    public DateTime? ApprovedAt { get; set; }

    public string? Notes { get; set; }

    public Guid CreatedByUserId { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public Project Project { get; set; } = null!;
    public User CreatedByUser { get; set; } = null!;
}

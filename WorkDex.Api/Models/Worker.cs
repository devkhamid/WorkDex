namespace WorkDex.Api.Models;

// PDF §6 va §14 — Usta / brigada ma'lumotlari
public class Worker
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public string FullName { get; set; } = string.Empty;
    public string PhoneNumber { get; set; } = string.Empty;
    public string? Specialty { get; set; } // Kafelchi, Suvoqchi, Elektrik, Santexnik, Malyar...
    public string? Notes { get; set; }
    public Guid? CompanyAdminId { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public ICollection<WorkerPayment> Payments { get; set; } = new List<WorkerPayment>();
}

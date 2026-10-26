namespace WorkDex.Api.Models;

public class Worker
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public string FullName { get; set; } = string.Empty;
    public string PhoneNumber { get; set; } = string.Empty;
    public string? Specialty { get; set; }    public string? Notes { get; set; }
    public Guid? CompanyAdminId { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public ICollection<WorkerPayment> Payments { get; set; } = new List<WorkerPayment>();
}

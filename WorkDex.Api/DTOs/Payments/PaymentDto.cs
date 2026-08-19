using WorkDex.Api.Models;

namespace WorkDex.Api.DTOs.Payments;

public class PaymentDto
{
    public Guid Id { get; set; }
    public Guid ProjectId { get; set; }
    public decimal Amount { get; set; }
    public PaymentMethod PaymentMethod { get; set; }
    public string PaymentMethodName { get; set; } = string.Empty;
    public DateTime PaymentDate { get; set; }
    public string? Notes { get; set; }
    public Guid ReceivedByUserId { get; set; }
    public string ReceivedByName { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
}

using System.ComponentModel.DataAnnotations;
using WorkDex.Api.Models;

namespace WorkDex.Api.DTOs.Payments;

public class CreatePaymentDto
{
    [Required]
    [Range(0.01, double.MaxValue, ErrorMessage = "To'lov summasi 0 dan katta bo'lishi kerak.")]
    public decimal Amount { get; set; }

    [Required]
    public PaymentMethod PaymentMethod { get; set; }

    [Required]
    public DateTime PaymentDate { get; set; }

    [MaxLength(1000)]
    public string? Notes { get; set; }
}

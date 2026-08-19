using WorkDex.Api.DTOs.Payments;

namespace WorkDex.Api.Services;

public interface IPaymentService
{
    Task<PaymentDto> AddPaymentAsync(Guid projectId, CreatePaymentDto dto, Guid receivedByUserId);
    Task<List<PaymentDto>> GetPaymentsByProjectAsync(Guid projectId);
    Task<PaymentDto> GetPaymentByIdAsync(Guid projectId, Guid paymentId);
    Task DeletePaymentAsync(Guid projectId, Guid paymentId);
}

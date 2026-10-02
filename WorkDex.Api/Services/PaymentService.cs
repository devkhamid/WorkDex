using Microsoft.EntityFrameworkCore;
using WorkDex.Api.Data;
using WorkDex.Api.DTOs.Payments;
using WorkDex.Api.Models;

namespace WorkDex.Api.Services;

public class PaymentService : IPaymentService
{
    private readonly AppDbContext _context;
    private readonly ICurrencyService _currencyService;

    public PaymentService(AppDbContext context, ICurrencyService currencyService)
    {
        _context = context;
        _currencyService = currencyService;
    }

    public async Task<PaymentDto> AddPaymentAsync(Guid projectId, CreatePaymentDto dto, Guid receivedByUserId)
    {
        var project = await _context.Projects.FindAsync(projectId);
        if (project is null)
            throw new KeyNotFoundException("Loyiha topilmadi.");

        var user = await _context.Users.FindAsync(receivedByUserId);
        if (user is null)
            throw new KeyNotFoundException("Foydalanuvchi topilmadi.");

        var currency = Money.Normalize(dto.Currency, "USD");
        var rate = await Money.CurrentRateAsync(_currencyService);

        var payment = new Payment
        {
            ProjectId = projectId,
            Amount = Money.ToUsd(dto.Amount, currency, rate),
            Currency = currency,
            ExchangeRate = rate,
            OriginalAmount = dto.Amount,
            PaymentMethod = dto.PaymentMethod,
            PaymentDate = dto.PaymentDate,
            Notes = dto.Notes?.Trim(),
            ReceivedByUserId = receivedByUserId,
            CreatedAt = DateTime.UtcNow
        };

        _context.Payments.Add(payment);
        await _context.SaveChangesAsync();

        return MapToDto(payment, user.FullName, rate);
    }

    public async Task<List<PaymentDto>> GetPaymentsByProjectAsync(Guid projectId)
    {
        var projectExists = await _context.Projects.AnyAsync(p => p.Id == projectId);
        if (!projectExists)
            throw new KeyNotFoundException("Loyiha topilmadi.");

        var payments = await _context.Payments
            .Include(p => p.ReceivedByUser)
            .Where(p => p.ProjectId == projectId)
            .OrderByDescending(p => p.PaymentDate)
            .ToListAsync();

        var currentRate = await Money.CurrentRateAsync(_currencyService);
        return payments.Select(p => MapToDto(p, p.ReceivedByUser?.FullName ?? "", currentRate)).ToList();
    }

    public async Task<PaymentDto> GetPaymentByIdAsync(Guid projectId, Guid paymentId)
    {
        var payment = await _context.Payments
            .Include(p => p.ReceivedByUser)
            .FirstOrDefaultAsync(p => p.Id == paymentId && p.ProjectId == projectId);

        if (payment is null)
            throw new KeyNotFoundException("To'lov topilmadi.");

        return MapToDto(payment, payment.ReceivedByUser?.FullName ?? "", await Money.CurrentRateAsync(_currencyService));
    }

    private static PaymentDto MapToDto(Payment p, string receivedByName, decimal fallbackRate)
    {
        var rate = p.ExchangeRate is > 0 ? p.ExchangeRate.Value : fallbackRate;
        return new PaymentDto
        {
            Id = p.Id,
            ProjectId = p.ProjectId,
            Amount = p.Amount,
            Currency = p.Currency,
            ExchangeRate = p.ExchangeRate,
            OriginalAmount = p.OriginalAmount,
            AmountUzs = p.Currency == "UZS" && p.OriginalAmount.HasValue ? p.OriginalAmount.Value : Math.Round(p.Amount * rate, 2),
            PaymentMethod = p.PaymentMethod,
            PaymentMethodName = p.PaymentMethod.ToString(),
            PaymentDate = p.PaymentDate,
            Notes = p.Notes,
            ReceivedByUserId = p.ReceivedByUserId,
            ReceivedByName = receivedByName,
            CreatedAt = p.CreatedAt
        };
    }

    public async Task DeletePaymentAsync(Guid projectId, Guid paymentId)
    {
        var payment = await _context.Payments
            .FirstOrDefaultAsync(p => p.Id == paymentId && p.ProjectId == projectId);

        if (payment is null)
            throw new KeyNotFoundException("To'lov topilmadi.");

        _context.Payments.Remove(payment);
        await _context.SaveChangesAsync();
    }
}

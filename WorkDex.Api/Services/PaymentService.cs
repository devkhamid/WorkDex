using Microsoft.EntityFrameworkCore;
using WorkDex.Api.Data;
using WorkDex.Api.DTOs.Payments;
using WorkDex.Api.Models;

namespace WorkDex.Api.Services;

public class PaymentService : IPaymentService
{
    private readonly AppDbContext _context;

    public PaymentService(AppDbContext context)
    {
        _context = context;
    }

    public async Task<PaymentDto> AddPaymentAsync(Guid projectId, CreatePaymentDto dto, Guid receivedByUserId)
    {
        var project = await _context.Projects.FindAsync(projectId);
        if (project is null)
            throw new KeyNotFoundException("Loyiha topilmadi.");

        var user = await _context.Users.FindAsync(receivedByUserId);
        if (user is null)
            throw new KeyNotFoundException("Foydalanuvchi topilmadi.");

        var payment = new Payment
        {
            ProjectId = projectId,
            Amount = dto.Amount,
            PaymentMethod = dto.PaymentMethod,
            PaymentDate = dto.PaymentDate,
            Notes = dto.Notes?.Trim(),
            ReceivedByUserId = receivedByUserId,
            CreatedAt = DateTime.UtcNow
        };

        _context.Payments.Add(payment);
        await _context.SaveChangesAsync();

        return new PaymentDto
        {
            Id = payment.Id,
            ProjectId = payment.ProjectId,
            Amount = payment.Amount,
            PaymentMethod = payment.PaymentMethod,
            PaymentMethodName = payment.PaymentMethod.ToString(),
            PaymentDate = payment.PaymentDate,
            Notes = payment.Notes,
            ReceivedByUserId = payment.ReceivedByUserId,
            ReceivedByName = user.FullName,
            CreatedAt = payment.CreatedAt
        };
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

        return payments.Select(p => new PaymentDto
        {
            Id = p.Id,
            ProjectId = p.ProjectId,
            Amount = p.Amount,
            PaymentMethod = p.PaymentMethod,
            PaymentMethodName = p.PaymentMethod.ToString(),
            PaymentDate = p.PaymentDate,
            Notes = p.Notes,
            ReceivedByUserId = p.ReceivedByUserId,
            ReceivedByName = p.ReceivedByUser?.FullName ?? "",
            CreatedAt = p.CreatedAt
        }).ToList();
    }

    public async Task<PaymentDto> GetPaymentByIdAsync(Guid projectId, Guid paymentId)
    {
        var payment = await _context.Payments
            .Include(p => p.ReceivedByUser)
            .FirstOrDefaultAsync(p => p.Id == paymentId && p.ProjectId == projectId);

        if (payment is null)
            throw new KeyNotFoundException("To'lov topilmadi.");

        return new PaymentDto
        {
            Id = payment.Id,
            ProjectId = payment.ProjectId,
            Amount = payment.Amount,
            PaymentMethod = payment.PaymentMethod,
            PaymentMethodName = payment.PaymentMethod.ToString(),
            PaymentDate = payment.PaymentDate,
            Notes = payment.Notes,
            ReceivedByUserId = payment.ReceivedByUserId,
            ReceivedByName = payment.ReceivedByUser?.FullName ?? "",
            CreatedAt = payment.CreatedAt
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

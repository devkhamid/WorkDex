using Microsoft.EntityFrameworkCore;
using WorkDex.Api.Data;
using WorkDex.Api.DTOs.Workers;
using WorkDex.Api.Models;

namespace WorkDex.Api.Services;

public class WorkerService : IWorkerService
{
    private readonly AppDbContext _context;

    public WorkerService(AppDbContext context)
    {
        _context = context;
    }

    public async Task<List<WorkerDto>> GetAllWorkersAsync(Guid requestingUserId, UserRole requestingUserRole)
    {
        var query = _context.Workers.AsQueryable();

        if (requestingUserRole == UserRole.SuperAdmin)
        {
            // SuperAdmin barcha ustalarni ko'radi
        }
        else if (requestingUserRole == UserRole.Admin)
        {
            query = query.Where(w => w.CompanyAdminId == requestingUserId);
        }
        else
        {
            var user = await _context.Users.FindAsync(requestingUserId);
            var targetCompanyAdminId = user?.CompanyAdminId ?? requestingUserId;
            query = query.Where(w => w.CompanyAdminId == targetCompanyAdminId);
        }

        var workers = await query
            .OrderBy(w => w.FullName)
            .ToListAsync();

        return workers.Select(w => new WorkerDto
        {
            Id = w.Id,
            FullName = w.FullName,
            PhoneNumber = w.PhoneNumber,
            Specialty = w.Specialty,
            Notes = w.Notes,
            CreatedAt = w.CreatedAt
        }).ToList();
    }

    public async Task<WorkerDto> GetWorkerByIdAsync(Guid id)
    {
        var worker = await _context.Workers.FindAsync(id);
        if (worker is null)
            throw new KeyNotFoundException("Usta topilmadi.");

        return new WorkerDto
        {
            Id = worker.Id,
            FullName = worker.FullName,
            PhoneNumber = worker.PhoneNumber,
            Specialty = worker.Specialty,
            Notes = worker.Notes,
            CreatedAt = worker.CreatedAt
        };
    }

    public async Task<WorkerDto> CreateWorkerAsync(CreateWorkerDto dto, Guid createdByUserId)
    {
        var requestingUser = await _context.Users.FindAsync(createdByUserId);
        var companyAdminId = requestingUser?.Role == UserRole.Admin
            ? createdByUserId
            : (requestingUser?.CompanyAdminId ?? createdByUserId);

        var worker = new Worker
        {
            FullName = dto.FullName.Trim(),
            PhoneNumber = dto.PhoneNumber.Trim(),
            Specialty = dto.Specialty?.Trim(),
            Notes = dto.Notes?.Trim(),
            CompanyAdminId = companyAdminId,
            CreatedAt = DateTime.UtcNow
        };

        _context.Workers.Add(worker);
        await _context.SaveChangesAsync();

        return new WorkerDto
        {
            Id = worker.Id,
            FullName = worker.FullName,
            PhoneNumber = worker.PhoneNumber,
            Specialty = worker.Specialty,
            Notes = worker.Notes,
            CreatedAt = worker.CreatedAt
        };
    }

    public async Task<WorkerDto> UpdateWorkerAsync(Guid id, CreateWorkerDto dto)
    {
        var worker = await _context.Workers.FindAsync(id);
        if (worker is null)
            throw new KeyNotFoundException("Usta topilmadi.");

        worker.FullName = dto.FullName.Trim();
        worker.PhoneNumber = dto.PhoneNumber.Trim();
        worker.Specialty = dto.Specialty?.Trim();
        worker.Notes = dto.Notes?.Trim();

        await _context.SaveChangesAsync();

        return new WorkerDto
        {
            Id = worker.Id,
            FullName = worker.FullName,
            PhoneNumber = worker.PhoneNumber,
            Specialty = worker.Specialty,
            Notes = worker.Notes,
            CreatedAt = worker.CreatedAt
        };
    }

    public async Task DeleteWorkerAsync(Guid id)
    {
        var worker = await _context.Workers
            .Include(w => w.Payments)
            .FirstOrDefaultAsync(w => w.Id == id);

        if (worker is null)
            throw new KeyNotFoundException("Usta topilmadi.");

        if (worker.Payments.Any())
            throw new InvalidOperationException("Ushbu usta loyihalarda ishlagan, uni o'chirib bo'lmaydi.");

        _context.Workers.Remove(worker);
        await _context.SaveChangesAsync();
    }

    public async Task<WorkerPaymentDto> AddWorkerJobAsync(Guid projectId, CreateWorkerPaymentDto dto, Guid createdByUserId)
    {
        var project = await _context.Projects.FindAsync(projectId);
        if (project is null)
            throw new KeyNotFoundException("Loyiha topilmadi.");

        var worker = await _context.Workers.FindAsync(dto.WorkerId);
        if (worker is null)
            throw new KeyNotFoundException("Usta topilmadi.");

        var user = await _context.Users.FindAsync(createdByUserId);
        if (user is null)
            throw new KeyNotFoundException("Foydalanuvchi topilmadi.");

        if (dto.WorkAmount > dto.AgreedAmount)
        {
            throw new InvalidOperationException($"Ishlangan haq (${dto.WorkAmount:N0}) kelishilgan umumiy summadan (${dto.AgreedAmount:N0}) ko'p bo'lishi mumkin emas.");
        }

        if (dto.PaidAmount > dto.AgreedAmount)
        {
            throw new InvalidOperationException($"Ustaga faqat ${dto.AgreedAmount:N0} gacha to'lash mumkin. Boshlang'ich to'lov kelishilgan umumiy summadan oshib ketmoqda.");
        }

        var workerPayment = new WorkerPayment
        {
            ProjectId = projectId,
            WorkerId = dto.WorkerId,
            JobDescription = dto.JobDescription.Trim(),
            AgreedAmount = dto.AgreedAmount,
            WorkAmount = dto.WorkAmount,
            PaidAmount = dto.PaidAmount,
            PaymentDate = dto.PaymentDate,
            Notes = dto.Notes?.Trim(),
            CreatedByUserId = createdByUserId,
            CreatedAt = DateTime.UtcNow
        };

        _context.WorkerPayments.Add(workerPayment);
        await _context.SaveChangesAsync();

        return new WorkerPaymentDto
        {
            Id = workerPayment.Id,
            ProjectId = workerPayment.ProjectId,
            WorkerId = workerPayment.WorkerId,
            WorkerName = worker.FullName,
            WorkerSpecialty = worker.Specialty,
            JobDescription = workerPayment.JobDescription,
            AgreedAmount = workerPayment.AgreedAmount,
            WorkAmount = workerPayment.WorkAmount,
            PaidAmount = workerPayment.PaidAmount,
            PaymentDate = workerPayment.PaymentDate,
            Notes = workerPayment.Notes,
            CreatedByUserId = workerPayment.CreatedByUserId,
            CreatedByName = user.FullName,
            CreatedAt = workerPayment.CreatedAt
        };
    }

    public async Task<List<WorkerPaymentDto>> GetWorkerJobsByProjectAsync(Guid projectId)
    {
        var projectExists = await _context.Projects.AnyAsync(p => p.Id == projectId);
        if (!projectExists)
            throw new KeyNotFoundException("Loyiha topilmadi.");

        var jobs = await _context.WorkerPayments
            .Include(wp => wp.Worker)
            .Include(wp => wp.CreatedByUser)
            .Where(wp => wp.ProjectId == projectId)
            .OrderByDescending(wp => wp.CreatedAt)
            .ToListAsync();

        return jobs.Select(wp => new WorkerPaymentDto
        {
            Id = wp.Id,
            ProjectId = wp.ProjectId,
            WorkerId = wp.WorkerId,
            WorkerName = wp.Worker?.FullName ?? "",
            WorkerSpecialty = wp.Worker?.Specialty,
            JobDescription = wp.JobDescription,
            AgreedAmount = wp.AgreedAmount,
            WorkAmount = wp.WorkAmount,
            PaidAmount = wp.PaidAmount,
            PaymentDate = wp.PaymentDate,
            Notes = wp.Notes,
            CreatedByUserId = wp.CreatedByUserId,
            CreatedByName = wp.CreatedByUser?.FullName ?? "",
            CreatedAt = wp.CreatedAt
        }).ToList();
    }

    public async Task<WorkerPaymentDto> GetWorkerJobByIdAsync(Guid projectId, Guid paymentId)
    {
        var job = await _context.WorkerPayments
            .Include(wp => wp.Worker)
            .Include(wp => wp.CreatedByUser)
            .FirstOrDefaultAsync(wp => wp.Id == paymentId && wp.ProjectId == projectId);

        if (job is null)
            throw new KeyNotFoundException("Usta ishi / to'lovi topilmadi.");

        return new WorkerPaymentDto
        {
            Id = job.Id,
            ProjectId = job.ProjectId,
            WorkerId = job.WorkerId,
            WorkerName = job.Worker?.FullName ?? "",
            WorkerSpecialty = job.Worker?.Specialty,
            JobDescription = job.JobDescription,
            AgreedAmount = job.AgreedAmount,
            WorkAmount = job.WorkAmount,
            PaidAmount = job.PaidAmount,
            PaymentDate = job.PaymentDate,
            Notes = job.Notes,
            CreatedByUserId = job.CreatedByUserId,
            CreatedByName = job.CreatedByUser?.FullName ?? "",
            CreatedAt = job.CreatedAt
        };
    }

    public async Task<WorkerPaymentDto> UpdateWorkAmountAsync(Guid projectId, Guid paymentId, UpdateWorkerWorkAmountDto dto)
    {
        var job = await _context.WorkerPayments
            .Include(wp => wp.Worker)
            .Include(wp => wp.CreatedByUser)
            .FirstOrDefaultAsync(wp => wp.Id == paymentId && wp.ProjectId == projectId);

        if (job is null)
            throw new KeyNotFoundException("Usta ishi / to'lovi topilmadi.");

        if (dto.WorkAmount > job.AgreedAmount)
        {
            throw new InvalidOperationException($"Ishlangan haq (${dto.WorkAmount:N0}) kelishilgan umumiy summadan (${job.AgreedAmount:N0}) ko'p bo'lishi mumkin emas.");
        }

        if (dto.WorkAmount < job.PaidAmount)
        {
            throw new InvalidOperationException($"Ishlangan haqni (${job.PaidAmount:N0}) allaqachon to'langan summadan past qilib bo'lmaydi.");
        }

        job.WorkAmount = dto.WorkAmount;
        if (!string.IsNullOrWhiteSpace(dto.Notes))
        {
            job.Notes = string.IsNullOrWhiteSpace(job.Notes)
                ? dto.Notes.Trim()
                : $"{job.Notes} | Ish haqi yangilandi: ${dto.WorkAmount:N0} ({dto.Notes.Trim()})";
        }

        await _context.SaveChangesAsync();

        return new WorkerPaymentDto
        {
            Id = job.Id,
            ProjectId = job.ProjectId,
            WorkerId = job.WorkerId,
            WorkerName = job.Worker?.FullName ?? "",
            WorkerSpecialty = job.Worker?.Specialty,
            JobDescription = job.JobDescription,
            AgreedAmount = job.AgreedAmount,
            WorkAmount = job.WorkAmount,
            PaidAmount = job.PaidAmount,
            PaymentDate = job.PaymentDate,
            Notes = job.Notes,
            CreatedByUserId = job.CreatedByUserId,
            CreatedByName = job.CreatedByUser?.FullName ?? "",
            CreatedAt = job.CreatedAt
        };
    }

    public async Task<WorkerPaymentDto> PayWorkerAsync(Guid projectId, Guid paymentId, PayWorkerDto dto)
    {
        var job = await _context.WorkerPayments
            .Include(wp => wp.Worker)
            .Include(wp => wp.CreatedByUser)
            .FirstOrDefaultAsync(wp => wp.Id == paymentId && wp.ProjectId == projectId);

        if (job is null)
            throw new KeyNotFoundException("Usta ishi / to'lovi topilmadi.");

        var remainingAllowed = job.AgreedAmount - job.PaidAmount;
        if (remainingAllowed <= 0)
        {
            throw new InvalidOperationException($"Ustaga kelishilgan summa (${job.AgreedAmount:N0}) allaqachon to'liq to'langan.");
        }

        if (dto.Amount > remainingAllowed)
        {
            throw new InvalidOperationException($"Ustaga faqat ${remainingAllowed:N0} to'lash mumkin. Kiritilgan summa (${dto.Amount:N0}) kelishilgan umumiy summadan (${job.AgreedAmount:N0}) oshib ketmoqda.");
        }

        job.PaidAmount += dto.Amount;
        job.PaymentDate = dto.PaymentDate;
        if (!string.IsNullOrWhiteSpace(dto.Notes))
        {
            job.Notes = string.IsNullOrWhiteSpace(job.Notes)
                ? dto.Notes.Trim()
                : $"{job.Notes} | To'lov: ${dto.Amount:N0} ({dto.Notes.Trim()})";
        }

        await _context.SaveChangesAsync();

        return new WorkerPaymentDto
        {
            Id = job.Id,
            ProjectId = job.ProjectId,
            WorkerId = job.WorkerId,
            WorkerName = job.Worker?.FullName ?? "",
            WorkerSpecialty = job.Worker?.Specialty,
            JobDescription = job.JobDescription,
            AgreedAmount = job.AgreedAmount,
            WorkAmount = job.WorkAmount,
            PaidAmount = job.PaidAmount,
            PaymentDate = job.PaymentDate,
            Notes = job.Notes,
            CreatedByUserId = job.CreatedByUserId,
            CreatedByName = job.CreatedByUser?.FullName ?? "",
            CreatedAt = job.CreatedAt
        };
    }

    public async Task DeleteWorkerJobAsync(Guid projectId, Guid paymentId)
    {
        var job = await _context.WorkerPayments
            .FirstOrDefaultAsync(wp => wp.Id == paymentId && wp.ProjectId == projectId);

        if (job is null)
            throw new KeyNotFoundException("Usta ishi / to'lovi topilmadi.");

        _context.WorkerPayments.Remove(job);
        await _context.SaveChangesAsync();
    }

    public async Task<List<ProjectWorkerSummaryDto>> GetProjectWorkersSummaryAsync(Guid projectId)
    {
        var projectExists = await _context.Projects.AnyAsync(p => p.Id == projectId);
        if (!projectExists)
            throw new KeyNotFoundException("Loyiha topilmadi.");

        var summary = await _context.WorkerPayments
            .Include(wp => wp.Worker)
            .Where(wp => wp.ProjectId == projectId)
            .GroupBy(wp => new { wp.WorkerId, wp.Worker.FullName, wp.Worker.Specialty })
            .Select(g => new ProjectWorkerSummaryDto
            {
                WorkerId = g.Key.WorkerId,
                WorkerName = g.Key.FullName,
                Specialty = g.Key.Specialty,
                TotalAgreedAmount = g.Sum(x => x.AgreedAmount),
                TotalWorkAmount = g.Sum(x => x.WorkAmount),
                TotalPaidAmount = g.Sum(x => x.PaidAmount),
                JobCount = g.Count()
            })
            .OrderByDescending(s => s.TotalWorkAmount)
            .ToListAsync();

        return summary;
    }
}

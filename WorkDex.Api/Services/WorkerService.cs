using Microsoft.EntityFrameworkCore;
using WorkDex.Api.Data;
using WorkDex.Api.DTOs.Workers;
using WorkDex.Api.Models;

namespace WorkDex.Api.Services;

public class WorkerService : IWorkerService
{
    private readonly AppDbContext _context;
    private readonly ICurrencyService _currencyService;

    public WorkerService(AppDbContext context, ICurrencyService currencyService)
    {
        _context = context;
        _currencyService = currencyService;
    }

    public async Task<List<WorkerDto>> GetAllWorkersAsync(Guid requestingUserId, UserRole requestingUserRole)
    {
        var query = _context.Workers.AsQueryable();

        if (requestingUserRole == UserRole.SuperAdmin)
        {
            // SuperAdmin barcha ustalarni ko'radi
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

    public async Task<WorkerDto> GetWorkerByIdAsync(Guid id, Guid requestingUserId, UserRole requestingUserRole)
    {
        var worker = await _context.Workers.FindAsync(id);
        if (worker is null)
            throw new KeyNotFoundException("Usta topilmadi.");

        await EnsureSameCompanyAsync(worker, requestingUserId, requestingUserRole);

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
        var companyAdminId = requestingUser?.CompanyAdminId ?? createdByUserId;

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

    public async Task<WorkerDto> UpdateWorkerAsync(Guid id, CreateWorkerDto dto, Guid requestingUserId, UserRole requestingUserRole)
    {
        var worker = await _context.Workers.FindAsync(id);
        if (worker is null)
            throw new KeyNotFoundException("Usta topilmadi.");

        await EnsureSameCompanyAsync(worker, requestingUserId, requestingUserRole);

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

    public async Task DeleteWorkerAsync(Guid id, Guid requestingUserId, UserRole requestingUserRole)
    {
        var worker = await _context.Workers
            .Include(w => w.Payments)
            .FirstOrDefaultAsync(w => w.Id == id);

        if (worker is null)
            throw new KeyNotFoundException("Usta topilmadi.");

        await EnsureSameCompanyAsync(worker, requestingUserId, requestingUserRole);

        if (worker.Payments.Any())
            throw new InvalidOperationException("Ushbu usta loyihalarda ishlagan, uni o'chirib bo'lmaydi.");

        _context.Workers.Remove(worker);
        await _context.SaveChangesAsync();
    }

    private async Task<Guid> ResolveCompanyAdminIdAsync(Guid requestingUserId, UserRole requestingUserRole)
    {
        var user = await _context.Users.FindAsync(requestingUserId);
        return user?.CompanyAdminId ?? requestingUserId;
    }

    private async Task EnsureSameCompanyAsync(Worker worker, Guid requestingUserId, UserRole requestingUserRole)
    {
        if (requestingUserRole == UserRole.SuperAdmin) return;
        var companyAdminId = await ResolveCompanyAdminIdAsync(requestingUserId, requestingUserRole);
        if (worker.CompanyAdminId != companyAdminId)
            throw new KeyNotFoundException("Usta topilmadi.");
    }

    public async Task<WorkerPaymentDto> AddWorkerJobAsync(Guid projectId, CreateWorkerPaymentDto dto, Guid createdByUserId)
    {
        var project = await _context.Projects.FindAsync(projectId);
        if (project is null)
            throw new KeyNotFoundException("Loyiha topilmadi.");

        var worker = await _context.Workers.FindAsync(dto.WorkerId);
        if (worker is null)
            throw new KeyNotFoundException("Usta topilmadi.");

        // Usta o'z kompaniyasiga tegishli ekanini tekshirish
        if (project.CompanyAdminId != null && worker.CompanyAdminId != null && worker.CompanyAdminId != project.CompanyAdminId)
            throw new InvalidOperationException("Tanlangan usta boshqa kompaniyaga tegishli.");

        var user = await _context.Users.FindAsync(createdByUserId);
        if (user is null)
            throw new KeyNotFoundException("Foydalanuvchi topilmadi.");

        // Barcha summalar (kelishilgan, bajarilgan, to'langan) Currency da kiritiladi va so'mda saqlanadi
        var currency = Money.Normalize(dto.Currency, "UZS");
        var rate = await Money.CurrentRateAsync(_currencyService);
        var effectiveAgreed = Money.ToUzs(dto.AgreedAmount, currency, rate);
        var effectiveWork = Money.ToUzs(dto.WorkAmount, currency, rate);
        var effectivePaid = Money.ToUzs(dto.PaidAmount, currency, rate);

        if (effectiveWork > effectiveAgreed)
        {
            throw new InvalidOperationException($"Ishlangan haq ({effectiveWork:N0} so'm) kelishilgan umumiy summadan ({effectiveAgreed:N0} so'm) ko'p bo'lishi mumkin emas.");
        }

        if (effectivePaid > effectiveAgreed)
        {
            throw new InvalidOperationException($"Ustaga faqat {effectiveAgreed:N0} so'm gacha to'lash mumkin. Boshlang'ich to'lov kelishilgan umumiy summadan oshib ketmoqda.");
        }

        var workerPayment = new WorkerPayment
        {
            ProjectId = projectId,
            WorkerId = dto.WorkerId,
            JobDescription = dto.JobDescription.Trim(),
            AgreedAmount = effectiveAgreed,
            Currency = currency,
            ExchangeRateToUzs = rate,
            OriginalAgreedAmount = dto.AgreedAmount,
            WorkAmount = effectiveWork,
            PaidAmount = effectivePaid,
            PaymentDate = dto.PaymentDate,
            Notes = dto.Notes?.Trim(),
            CreatedByUserId = createdByUserId,
            CreatedAt = DateTime.UtcNow
        };

        _context.WorkerPayments.Add(workerPayment);
        await _context.SaveChangesAsync();

        return MapToDto(workerPayment, worker.FullName, worker.Specialty, user.FullName, rate);
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

        var currentRate = await Money.CurrentRateAsync(_currencyService);
        return jobs.Select(wp => MapToDto(wp, wp.Worker?.FullName ?? "", wp.Worker?.Specialty, wp.CreatedByUser?.FullName ?? "", currentRate)).ToList();
    }

    public async Task<WorkerPaymentDto> GetWorkerJobByIdAsync(Guid projectId, Guid paymentId)
    {
        var job = await _context.WorkerPayments
            .Include(wp => wp.Worker)
            .Include(wp => wp.CreatedByUser)
            .FirstOrDefaultAsync(wp => wp.Id == paymentId && wp.ProjectId == projectId);

        if (job is null)
            throw new KeyNotFoundException("Usta ishi / to'lovi topilmadi.");

        return MapToDto(job, job.Worker?.FullName ?? "", job.Worker?.Specialty, job.CreatedByUser?.FullName ?? "", await Money.CurrentRateAsync(_currencyService));
    }

    public async Task<WorkerPaymentDto> UpdateWorkAmountAsync(Guid projectId, Guid paymentId, UpdateWorkerWorkAmountDto dto)
    {
        var job = await _context.WorkerPayments
            .Include(wp => wp.Worker)
            .Include(wp => wp.CreatedByUser)
            .FirstOrDefaultAsync(wp => wp.Id == paymentId && wp.ProjectId == projectId);

        if (job is null)
            throw new KeyNotFoundException("Usta ishi / to'lovi topilmadi.");

        var currency = Money.Normalize(dto.Currency, "UZS");
        var rate = await Money.CurrentRateAsync(_currencyService);
        var workAmount = Money.ToUzs(dto.WorkAmount, currency, rate);
        // USD dan o'girishdagi yaxlitlash farqi (1 sentgacha) kelishilgan summani "oshirib" yubormasligi uchun
        if (currency == "USD" && workAmount > job.AgreedAmount && workAmount - job.AgreedAmount <= rate * 0.01m)
            workAmount = job.AgreedAmount;

        if (workAmount > job.AgreedAmount)
        {
            throw new InvalidOperationException($"Ishlangan haq ({workAmount:N0} so'm) kelishilgan umumiy summadan ({job.AgreedAmount:N0} so'm) ko'p bo'lishi mumkin emas.");
        }

        if (workAmount < job.PaidAmount)
        {
            throw new InvalidOperationException($"Ishlangan haqni ({job.PaidAmount:N0} so'm) allaqachon to'langan summadan past qilib bo'lmaydi.");
        }

        job.WorkAmount = workAmount;
        if (!string.IsNullOrWhiteSpace(dto.Notes))
        {
            job.Notes = string.IsNullOrWhiteSpace(job.Notes)
                ? dto.Notes.Trim()
                : $"{job.Notes} | Ish haqi yangilandi: {workAmount:N0} so'm ({dto.Notes.Trim()})";
        }

        await _context.SaveChangesAsync();

        return MapToDto(job, job.Worker?.FullName ?? "", job.Worker?.Specialty, job.CreatedByUser?.FullName ?? "", rate);
    }

    public async Task<WorkerPaymentDto> PayWorkerAsync(Guid projectId, Guid paymentId, PayWorkerDto dto)
    {
        var job = await _context.WorkerPayments
            .Include(wp => wp.Worker)
            .Include(wp => wp.CreatedByUser)
            .FirstOrDefaultAsync(wp => wp.Id == paymentId && wp.ProjectId == projectId);

        if (job is null)
            throw new KeyNotFoundException("Usta ishi / to'lovi topilmadi.");

        var currency = Money.Normalize(dto.Currency, "UZS");
        var isUsd = currency == "USD";
        var rate = await Money.CurrentRateAsync(_currencyService);
        var originalAmount = dto.Amount;
        var effectiveAmount = Money.ToUzs(dto.Amount, currency, rate);

        var remainingAllowed = job.AgreedAmount - job.PaidAmount;
        if (remainingAllowed <= 0)
        {
            throw new InvalidOperationException($"Ustaga kelishilgan summa ({job.AgreedAmount:N0} so'm) allaqachon to'liq to'langan.");
        }

        // USD dan o'girishdagi yaxlitlash farqi (1 sentgacha) qoldiqni "oshirib" yubormasligi uchun
        if (isUsd && effectiveAmount > remainingAllowed && effectiveAmount - remainingAllowed <= rate * 0.01m)
            effectiveAmount = remainingAllowed;

        if (effectiveAmount > remainingAllowed)
        {
            throw new InvalidOperationException($"Ustaga faqat {remainingAllowed:N0} so'm to'lash mumkin. Kiritilgan summa ({effectiveAmount:N0} so'm) kelishilgan umumiy summadan ({job.AgreedAmount:N0} so'm) oshib ketmoqda.");
        }

        job.PaidAmount += effectiveAmount;
        job.PaymentDate = dto.PaymentDate;
        var paymentNote = isUsd
            ? $"To'lov: ${originalAmount:N2} USD (CBU kursi: {rate:N2}) = {effectiveAmount:N0} so'm"
            : $"To'lov: {effectiveAmount:N0} so'm";

        if (!string.IsNullOrWhiteSpace(dto.Notes))
        {
            job.Notes = string.IsNullOrWhiteSpace(job.Notes)
                ? $"{paymentNote} ({dto.Notes.Trim()})"
                : $"{job.Notes} | {paymentNote} ({dto.Notes.Trim()})";
        }
        else
        {
            job.Notes = string.IsNullOrWhiteSpace(job.Notes)
                ? paymentNote
                : $"{job.Notes} | {paymentNote}";
        }

        await _context.SaveChangesAsync();

        return MapToDto(job, job.Worker?.FullName ?? "", job.Worker?.Specialty, job.CreatedByUser?.FullName ?? "", rate);
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

    private static WorkerPaymentDto MapToDto(WorkerPayment wp, string workerName, string? specialty, string createdByName, decimal fallbackRate)
    {
        var rate = wp.ExchangeRateToUzs is > 0 ? wp.ExchangeRateToUzs.Value : fallbackRate;
        return new WorkerPaymentDto
        {
            Id = wp.Id,
            ProjectId = wp.ProjectId,
            WorkerId = wp.WorkerId,
            WorkerName = workerName,
            WorkerSpecialty = specialty,
            JobDescription = wp.JobDescription,
            AgreedAmount = wp.AgreedAmount,
            AgreedAmountUsd = wp.Currency == "USD" && wp.OriginalAgreedAmount.HasValue ? wp.OriginalAgreedAmount.Value : Math.Round(wp.AgreedAmount / rate, 2),
            PaidAmountUsd = Math.Round(wp.PaidAmount / rate, 2),
            Currency = wp.Currency ?? "UZS",
            ExchangeRateToUzs = wp.ExchangeRateToUzs,
            OriginalAgreedAmount = wp.OriginalAgreedAmount,
            WorkAmount = wp.WorkAmount,
            PaidAmount = wp.PaidAmount,
            PaymentDate = wp.PaymentDate,
            Notes = wp.Notes,
            CreatedByUserId = wp.CreatedByUserId,
            CreatedByName = createdByName,
            CreatedAt = wp.CreatedAt
        };
    }
}

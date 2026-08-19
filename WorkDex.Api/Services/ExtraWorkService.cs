using Microsoft.EntityFrameworkCore;
using WorkDex.Api.Data;
using WorkDex.Api.DTOs.ExtraWorks;
using WorkDex.Api.Models;

namespace WorkDex.Api.Services;

public class ExtraWorkService : IExtraWorkService
{
    private readonly AppDbContext _context;

    public ExtraWorkService(AppDbContext context)
    {
        _context = context;
    }

    public async Task<ExtraWorkDto> AddExtraWorkAsync(Guid projectId, CreateExtraWorkDto dto, Guid createdByUserId)
    {
        var project = await _context.Projects.FindAsync(projectId);
        if (project is null)
            throw new KeyNotFoundException("Loyiha topilmadi.");

        var user = await _context.Users.FindAsync(createdByUserId);
        if (user is null)
            throw new KeyNotFoundException("Foydalanuvchi topilmadi.");

        var extraWork = new ExtraWork
        {
            ProjectId = projectId,
            Title = dto.Title.Trim(),
            Description = dto.Description?.Trim(),
            CustomerAmount = dto.CustomerAmount,
            ActualCost = dto.ActualCost,
            IsApprovedByCustomer = dto.IsApprovedByCustomer,
            ApprovedAt = dto.IsApprovedByCustomer ? DateTime.UtcNow : null,
            Notes = dto.Notes?.Trim(),
            CreatedByUserId = createdByUserId,
            CreatedAt = DateTime.UtcNow
        };

        _context.ExtraWorks.Add(extraWork);
        await _context.SaveChangesAsync();

        return MapToDto(extraWork, user.FullName);
    }

    public async Task<List<ExtraWorkDto>> GetExtraWorksByProjectAsync(Guid projectId)
    {
        var projectExists = await _context.Projects.AnyAsync(p => p.Id == projectId);
        if (!projectExists)
            throw new KeyNotFoundException("Loyiha topilmadi.");

        var list = await _context.ExtraWorks
            .Include(ew => ew.CreatedByUser)
            .Where(ew => ew.ProjectId == projectId)
            .OrderByDescending(ew => ew.CreatedAt)
            .ToListAsync();

        return list.Select(ew => MapToDto(ew, ew.CreatedByUser?.FullName ?? "")).ToList();
    }

    public async Task<ExtraWorkDto> GetExtraWorkByIdAsync(Guid projectId, Guid extraWorkId)
    {
        var extraWork = await _context.ExtraWorks
            .Include(ew => ew.CreatedByUser)
            .FirstOrDefaultAsync(ew => ew.Id == extraWorkId && ew.ProjectId == projectId);

        if (extraWork is null)
            throw new KeyNotFoundException("Qo'shimcha ish topilmadi.");

        return MapToDto(extraWork, extraWork.CreatedByUser?.FullName ?? "");
    }

    public async Task<ExtraWorkDto> UpdateExtraWorkAsync(Guid projectId, Guid extraWorkId, UpdateExtraWorkDto dto)
    {
        var extraWork = await _context.ExtraWorks
            .Include(ew => ew.CreatedByUser)
            .FirstOrDefaultAsync(ew => ew.Id == extraWorkId && ew.ProjectId == projectId);

        if (extraWork is null)
            throw new KeyNotFoundException("Qo'shimcha ish topilmadi.");

        extraWork.Title = dto.Title.Trim();
        extraWork.Description = dto.Description?.Trim();
        extraWork.CustomerAmount = dto.CustomerAmount;
        extraWork.ActualCost = dto.ActualCost;
        if (!extraWork.IsApprovedByCustomer && dto.IsApprovedByCustomer)
        {
            extraWork.ApprovedAt = DateTime.UtcNow;
        }
        else if (!dto.IsApprovedByCustomer)
        {
            extraWork.ApprovedAt = null;
        }
        extraWork.IsApprovedByCustomer = dto.IsApprovedByCustomer;
        extraWork.Notes = dto.Notes?.Trim();

        await _context.SaveChangesAsync();

        return MapToDto(extraWork, extraWork.CreatedByUser?.FullName ?? "");
    }

    public async Task<ExtraWorkDto> ToggleApprovalAsync(Guid projectId, Guid extraWorkId)
    {
        var extraWork = await _context.ExtraWorks
            .Include(ew => ew.CreatedByUser)
            .FirstOrDefaultAsync(ew => ew.Id == extraWorkId && ew.ProjectId == projectId);

        if (extraWork is null)
            throw new KeyNotFoundException("Qo'shimcha ish topilmadi.");

        extraWork.IsApprovedByCustomer = !extraWork.IsApprovedByCustomer;
        extraWork.ApprovedAt = extraWork.IsApprovedByCustomer ? DateTime.UtcNow : null;

        await _context.SaveChangesAsync();

        return MapToDto(extraWork, extraWork.CreatedByUser?.FullName ?? "");
    }

    public async Task DeleteExtraWorkAsync(Guid projectId, Guid extraWorkId)
    {
        var extraWork = await _context.ExtraWorks
            .FirstOrDefaultAsync(ew => ew.Id == extraWorkId && ew.ProjectId == projectId);

        if (extraWork is null)
            throw new KeyNotFoundException("Qo'shimcha ish topilmadi.");

        _context.ExtraWorks.Remove(extraWork);
        await _context.SaveChangesAsync();
    }

    private static ExtraWorkDto MapToDto(ExtraWork ew, string createdByName) => new()
    {
        Id = ew.Id,
        ProjectId = ew.ProjectId,
        Title = ew.Title,
        Description = ew.Description,
        CustomerAmount = ew.CustomerAmount,
        ActualCost = ew.ActualCost,
        IsApprovedByCustomer = ew.IsApprovedByCustomer,
        ApprovedAt = ew.ApprovedAt,
        Notes = ew.Notes,
        CreatedByUserId = ew.CreatedByUserId,
        CreatedByName = createdByName,
        CreatedAt = ew.CreatedAt
    };
}

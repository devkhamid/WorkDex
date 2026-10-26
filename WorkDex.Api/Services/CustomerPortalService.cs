using Microsoft.EntityFrameworkCore;
using WorkDex.Api.Data;
using WorkDex.Api.DTOs.Portal;
using WorkDex.Api.Models;

namespace WorkDex.Api.Services;

public class CustomerPortalService : ICustomerPortalService
{
    private readonly AppDbContext _context;

    public CustomerPortalService(AppDbContext context)
    {
        _context = context;
    }

    public async Task<CustomerPortalProjectDto> GetProjectPortalAsync(Guid projectId, Guid requestingUserId, string requestingUserRole)
    {
        var project = await _context.Projects
            .Include(p => p.Customer)
            .Include(p => p.Stages)
            .Include(p => p.Photos.Where(ph => ph.IsVisibleToCustomer))
                .ThenInclude(ph => ph.Stage)
            .Include(p => p.Updates.Where(u => u.IsVisibleToCustomer))
                .ThenInclude(u => u.Stage)
            .Include(p => p.ExtraWorks.Where(ew => ew.IsApprovedByCustomer))
            .FirstOrDefaultAsync(p => p.Id == projectId);

        if (project is null)
            throw new KeyNotFoundException("Loyiha topilmadi.");

        if (requestingUserRole == "Customer")
        {
            var customerProfile = await _context.Customers
                .FirstOrDefaultAsync(c => c.UserId == requestingUserId);

            if (customerProfile is null || customerProfile.Id != project.CustomerId)
            {
                throw new UnauthorizedAccessException("Sizda ushbu loyihani ko'rish huquqi yo'q.");
            }
        }

        var totalPaid = await _context.Payments
            .Where(p => p.ProjectId == projectId)
            .SumAsync(p => (decimal?)p.Amount) ?? 0;

        var approvedExtraWorksSum = project.ExtraWorks.Sum(ew => ew.CustomerAmount);
        var totalContractAmount = project.ContractAmount + approvedExtraWorksSum;
        var remainingPayment = totalContractAmount - totalPaid;

        return new CustomerPortalProjectDto
        {
            ProjectId = project.Id,
            ProjectName = project.Name,
            ProjectType = project.ProjectType,
            Location = project.Location,
            StartDate = project.StartDate,
            EndDate = project.EndDate,
            Status = project.Status,
            StatusName = project.Status.ToString(),
            ProgressPercent = project.ProgressPercent,
            ContractAmount = totalContractAmount,
            TotalPaid = totalPaid,
            RemainingPayment = remainingPayment,
            Currency = project.Currency,

            Stages = project.Stages.OrderBy(s => s.OrderIndex).Select(s => new CustomerPortalStageDto
            {
                Id = s.Id,
                Name = s.Name,
                Description = s.Description,
                OrderIndex = s.OrderIndex,
                IsCompleted = s.IsCompleted,
                CompletedAt = s.CompletedAt
            }).ToList(),

            Photos = project.Photos.OrderByDescending(ph => ph.PhotoDate).Select(ph => new CustomerPortalPhotoDto
            {
                Id = ph.Id,
                StageName = ph.Stage?.Name,
                PhotoUrl = ph.PhotoUrl,
                Caption = ph.Caption,
                PhotoDate = ph.PhotoDate
            }).ToList(),

            Updates = project.Updates.OrderByDescending(u => u.CreatedAt).Select(u => new CustomerPortalUpdateDto
            {
                Id = u.Id,
                StageName = u.Stage?.Name,
                Message = u.Message,
                CreatedAt = u.CreatedAt
            }).ToList(),

            ApprovedExtraWorks = project.ExtraWorks.Select(ew => new CustomerPortalExtraWorkDto
            {
                Id = ew.Id,
                Title = ew.Title,
                Description = ew.Description,
                Amount = ew.CustomerAmount,
                ApprovedAt = ew.ApprovedAt
            }).ToList()
        };
    }
}

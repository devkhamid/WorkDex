using Microsoft.EntityFrameworkCore;
using WorkDex.Api.Data;
using WorkDex.Api.DTOs.Projects;
using WorkDex.Api.Models;

namespace WorkDex.Api.Services;

public class ProjectService : IProjectService
{
    private readonly AppDbContext _context;

    public ProjectService(AppDbContext context)
    {
        _context = context;
    }

    public async Task<List<ProjectDto>> GetAllAsync(Guid requestingUserId, UserRole requestingUserRole)
    {
        var query = _context.Projects
            .Include(p => p.Customer)
            .Include(p => p.CreatedByUser)
            .Include(p => p.Members)
            .Include(p => p.Stages)
            .AsQueryable();

        // 1. SuperAdmin barcha platformadagi loyihalarni ko'radi
        if (requestingUserRole == UserRole.SuperAdmin)
        {
            // Barcha loyihalar
        }
        // 2. Admin faqat o'z kompaniyasining loyihalarini ko'radi
        else if (requestingUserRole == UserRole.Admin)
        {
            query = query.Where(p =>
                p.CreatedByUserId == requestingUserId ||
                p.CompanyAdminId == requestingUserId ||
                (p.CreatedByUser != null && p.CreatedByUser.CompanyAdminId == requestingUserId));
        }
        // 3. ProjectManager, FieldWorker, Finance faqat o'z kompaniyasi/a'zo bo'lgan loyihalarni ko'radi
        else
        {
            var user = await _context.Users.FindAsync(requestingUserId);
            var targetCompanyAdminId = user?.CompanyAdminId ?? requestingUserId;

            query = query.Where(p =>
                p.CreatedByUserId == requestingUserId ||
                p.CompanyAdminId == targetCompanyAdminId ||
                p.Members.Any(m => m.UserId == requestingUserId));
        }

        var projects = await query.OrderByDescending(p => p.CreatedAt).ToListAsync();
        return projects.Select(MapToDto).ToList();
    }

    public async Task<ProjectDto> GetByIdAsync(Guid id)
    {
        var project = await _context.Projects
            .Include(p => p.Customer)
            .Include(p => p.CreatedByUser)
            .Include(p => p.Members)
            .Include(p => p.Stages)
            .FirstOrDefaultAsync(p => p.Id == id);

        if (project is null)
            throw new KeyNotFoundException("Loyiha topilmadi.");

        return MapToDto(project);
    }

    public async Task<ProjectDto> CreateAsync(CreateProjectDto dto, Guid createdByUserId)
    {
        // Mijoz mavjudligini va kompaniyaga tegishli ekanini tekshiramiz
        var customer = await _context.Customers.FindAsync(dto.CustomerId);
        if (customer is null)
            throw new KeyNotFoundException("Tanlangan mijoz topilmadi.");

        var requestingUser = await _context.Users.FindAsync(createdByUserId);
        var companyAdminId = requestingUser?.Role == UserRole.Admin 
            ? createdByUserId 
            : (requestingUser?.CompanyAdminId ?? createdByUserId);

        if (requestingUser?.Role != UserRole.SuperAdmin && customer.CompanyAdminId != null && customer.CompanyAdminId != companyAdminId)
            throw new InvalidOperationException("Tanlangan mijoz boshqa kompaniyaga tegishli.");

        var project = new Project
        {
            Name = dto.Name.Trim(),
            Description = dto.Description?.Trim(),
            ProjectType = dto.ProjectType?.Trim(),
            CustomerId = dto.CustomerId,
            ContractAmount = dto.ContractAmount,
            Budget = dto.Budget,
            Currency = string.IsNullOrWhiteSpace(dto.Currency) ? "USD" : dto.Currency.Trim(),
            StartDate = dto.StartDate,
            EndDate = dto.EndDate,
            Location = dto.Location?.Trim(),
            Notes = dto.Notes?.Trim(),
            Status = ProjectStatus.Planning,
            ProgressPercent = 0,
            CreatedByUserId = createdByUserId,
            CompanyAdminId = companyAdminId,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        _context.Projects.Add(project);
        await _context.SaveChangesAsync();

        return await GetByIdAsync(project.Id);
    }

    public async Task<ProjectDto> UpdateAsync(Guid id, UpdateProjectDto dto)
    {
        var project = await _context.Projects
            .Include(p => p.Customer)
            .Include(p => p.CreatedByUser)
            .Include(p => p.Members)
            .Include(p => p.Stages)
            .FirstOrDefaultAsync(p => p.Id == id);

        if (project is null)
            throw new KeyNotFoundException("Loyiha topilmadi.");

        var newCustomer = await _context.Customers.FindAsync(dto.CustomerId);
        if (newCustomer is null)
            throw new KeyNotFoundException("Tanlangan mijoz topilmadi.");

        // Yangi mijoz ham kompaniyaga tegishli ekanini tekshirish
        if (project.CompanyAdminId != null && newCustomer.CompanyAdminId != null && newCustomer.CompanyAdminId != project.CompanyAdminId)
            throw new InvalidOperationException("Tanlangan mijoz boshqa kompaniyaga tegishli.");

        project.Name = dto.Name.Trim();
        project.Description = dto.Description?.Trim();
        project.ProjectType = dto.ProjectType?.Trim();
        project.CustomerId = dto.CustomerId;
        project.ContractAmount = dto.ContractAmount;
        project.Budget = dto.Budget;
        project.Currency = dto.Currency;
        project.StartDate = dto.StartDate;
        project.EndDate = dto.EndDate;
        project.ActualEndDate = dto.ActualEndDate;
        project.Location = dto.Location?.Trim();
        project.Notes = dto.Notes?.Trim();
        project.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        return MapToDto(project);
    }

    public async Task<ProjectDto> UpdateStatusAsync(Guid id, UpdateProjectStatusDto dto)
    {
        var project = await _context.Projects
            .Include(p => p.Customer)
            .Include(p => p.CreatedByUser)
            .Include(p => p.Members)
            .Include(p => p.Stages)
            .FirstOrDefaultAsync(p => p.Id == id);

        if (project is null)
            throw new KeyNotFoundException("Loyiha topilmadi.");

        project.Status = dto.Status;

        // Tugallanganda haqiqiy tugash sanasini belgilaymiz
        if (dto.Status == ProjectStatus.Completed && project.ActualEndDate is null)
            project.ActualEndDate = DateTime.UtcNow;

        project.UpdatedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync();

        return MapToDto(project);
    }

    public async Task<ProjectSummaryDto> GetSummaryAsync(Guid id)
    {
        var project = await _context.Projects
            .Include(p => p.Customer)
            .FirstOrDefaultAsync(p => p.Id == id);

        if (project is null)
            throw new KeyNotFoundException("Loyiha topilmadi.");

        var totalPaid = await _context.Payments
            .Where(p => p.ProjectId == id)
            .SumAsync(p => (decimal?)p.Amount) ?? 0;

        var directMaterialPurchases = await _context.MaterialPurchases
            .Where(mp => mp.ProjectId == id)
            .SumAsync(mp => (decimal?)mp.TotalCost) ?? 0;

        var directMaterialExpenses = await _context.Expenses
            .Where(e => e.ProjectId == id && e.Category == ExpenseCategory.Material)
            .SumAsync(e => (decimal?)e.Amount) ?? 0;

        var materialExpenses = directMaterialPurchases + directMaterialExpenses;

        var directWorkerPayments = await _context.WorkerPayments
            .Where(wp => wp.ProjectId == id)
            .SumAsync(wp => (decimal?)wp.PaidAmount) ?? 0;

        var directLaborExpenses = await _context.Expenses
            .Where(e => e.ProjectId == id && e.Category == ExpenseCategory.Labor)
            .SumAsync(e => (decimal?)e.Amount) ?? 0;

        var laborExpenses = directWorkerPayments + directLaborExpenses;

        var otherExpenses = await _context.Expenses
            .Where(e => e.ProjectId == id && e.Category != ExpenseCategory.Material && e.Category != ExpenseCategory.Labor)
            .SumAsync(e => (decimal?)e.Amount) ?? 0;

        var extraWorkIncome = await _context.ExtraWorks
            .Where(ew => ew.ProjectId == id && ew.IsApprovedByCustomer)
            .SumAsync(ew => (decimal?)ew.CustomerAmount) ?? 0;

        var extraWorkCost = await _context.ExtraWorks
            .Where(ew => ew.ProjectId == id && ew.IsApprovedByCustomer)
            .SumAsync(ew => (decimal?)ew.ActualCost) ?? 0;

        var totalContractAmount = project.ContractAmount + extraWorkIncome;
        var totalExpenses = materialExpenses + laborExpenses + otherExpenses + extraWorkCost;

        var remainingPayment = totalContractAmount - totalPaid;
        var budgetUtilization = project.Budget > 0
            ? Math.Round(totalExpenses / project.Budget * 100, 2)
            : 0;
        var grossProfit = totalContractAmount - totalExpenses;
        var remainingBudget = project.Budget - totalExpenses;

        return new ProjectSummaryDto
        {
            ProjectId = project.Id,
            ProjectName = project.Name,
            CustomerName = project.Customer.FullName,
            ContractAmount = totalContractAmount,
            Currency = project.Currency,
            TotalPaid = totalPaid,
            RemainingPayment = remainingPayment,
            MaterialExpenses = materialExpenses,
            LaborExpenses = laborExpenses,
            OtherExpenses = otherExpenses,
            ExtraWorkIncome = extraWorkIncome,
            ExtraWorkCost = extraWorkCost,
            TotalExpenses = totalExpenses,
            BudgetUtilizationPercent = budgetUtilization,
            GrossProfit = grossProfit,
            RemainingBudget = remainingBudget,
            ProgressPercent = project.ProgressPercent,
            Status = project.Status
        };
    }

    public async Task<ProjectMemberDto> AddMemberAsync(Guid projectId, AddProjectMemberDto dto)
    {
        var project = await _context.Projects.FindAsync(projectId);
        if (project is null)
            throw new KeyNotFoundException("Loyiha topilmadi.");

        var user = await _context.Users.FindAsync(dto.UserId);
        if (user is null)
            throw new KeyNotFoundException("Foydalanuvchi topilmadi.");

        // Foydalanuvchi kompaniyaga tegishli ekanini tekshirish
        if (project.CompanyAdminId != null && user.CompanyAdminId != project.CompanyAdminId && user.Id != project.CompanyAdminId)
            throw new InvalidOperationException("Tanlangan foydalanuvchi boshqa kompaniyaga tegishli.");

        var alreadyMember = await _context.ProjectMembers
            .AnyAsync(pm => pm.ProjectId == projectId && pm.UserId == dto.UserId);

        if (alreadyMember)
            throw new InvalidOperationException("Bu foydalanuvchi loyihada allaqachon a'zo.");

        var member = new ProjectMember
        {
            ProjectId = projectId,
            UserId = dto.UserId,
            RoleInProject = dto.RoleInProject,
            AssignedAt = DateTime.UtcNow
        };

        _context.ProjectMembers.Add(member);
        await _context.SaveChangesAsync();

        return new ProjectMemberDto
        {
            UserId = user.Id,
            FullName = user.FullName,
            Email = user.Email,
            RoleInProject = dto.RoleInProject,
            RoleName = dto.RoleInProject.ToString(),
            AssignedAt = member.AssignedAt
        };
    }

    public async Task RemoveMemberAsync(Guid projectId, Guid userId)
    {
        var member = await _context.ProjectMembers
            .FirstOrDefaultAsync(pm => pm.ProjectId == projectId && pm.UserId == userId);

        if (member is null)
            throw new KeyNotFoundException("Bu foydalanuvchi loyihada a'zo emas.");

        _context.ProjectMembers.Remove(member);
        await _context.SaveChangesAsync();
    }

    public async Task<List<ProjectMemberDto>> GetMembersAsync(Guid projectId)
    {
        var members = await _context.ProjectMembers
            .Include(pm => pm.User)
            .Where(pm => pm.ProjectId == projectId)
            .OrderBy(pm => pm.AssignedAt)
            .ToListAsync();

        return members.Select(pm => new ProjectMemberDto
        {
            UserId = pm.UserId,
            FullName = pm.User.FullName,
            Email = pm.User.Email,
            RoleInProject = pm.RoleInProject,
            RoleName = pm.RoleInProject.ToString(),
            AssignedAt = pm.AssignedAt
        }).ToList();
    }

    public async Task<ProjectStageDto> AddStageAsync(Guid projectId, CreateProjectStageDto dto)
    {
        var projectExists = await _context.Projects.AnyAsync(p => p.Id == projectId);
        if (!projectExists)
            throw new KeyNotFoundException("Loyiha topilmadi.");

        var orderExists = await _context.ProjectStages
            .AnyAsync(s => s.ProjectId == projectId && s.OrderIndex == dto.OrderIndex);

        if (orderExists)
            throw new InvalidOperationException($"Bu loyihada {dto.OrderIndex}-tartib raqami allaqachon mavjud.");

        var stage = new ProjectStage
        {
            ProjectId = projectId,
            Name = dto.Name.Trim(),
            Description = dto.Description?.Trim(),
            OrderIndex = dto.OrderIndex,
            IsCompleted = false,
            CreatedAt = DateTime.UtcNow
        };

        _context.ProjectStages.Add(stage);
        await _context.SaveChangesAsync();

        return MapStageToDto(stage);
    }

    public async Task<List<ProjectStageDto>> GetStagesAsync(Guid projectId)
    {
        var stages = await _context.ProjectStages
            .Where(s => s.ProjectId == projectId)
            .OrderBy(s => s.OrderIndex)
            .ToListAsync();

        return stages.Select(MapStageToDto).ToList();
    }

    public async Task<ProjectStageDto> CompleteStageAsync(Guid projectId, Guid stageId)
    {
        var stage = await _context.ProjectStages
            .FirstOrDefaultAsync(s => s.Id == stageId && s.ProjectId == projectId);

        if (stage is null)
            throw new KeyNotFoundException("Bosqich topilmadi.");

        stage.IsCompleted = !stage.IsCompleted;
        stage.CompletedAt = stage.IsCompleted ? DateTime.UtcNow : null;

        await _context.SaveChangesAsync();

        return MapStageToDto(stage);
    }

    public async Task DeleteStageAsync(Guid projectId, Guid stageId)
    {
        var stage = await _context.ProjectStages
            .FirstOrDefaultAsync(s => s.Id == stageId && s.ProjectId == projectId);

        if (stage is null)
            throw new KeyNotFoundException("Bosqich topilmadi.");

        _context.ProjectStages.Remove(stage);
        await _context.SaveChangesAsync();
    }

    public async Task DeleteAsync(Guid id)
    {
        var project = await _context.Projects.FindAsync(id);
        if (project is null)
            throw new KeyNotFoundException("Loyiha topilmadi.");

        var updates = await _context.ProjectUpdates.Where(x => x.ProjectId == id).ToListAsync();
        _context.ProjectUpdates.RemoveRange(updates);

        var photos = await _context.Photos.Where(x => x.ProjectId == id).ToListAsync();
        _context.Photos.RemoveRange(photos);

        var docs = await _context.Documents.Where(x => x.ProjectId == id).ToListAsync();
        _context.Documents.RemoveRange(docs);

        var tasks = await _context.Tasks.Where(x => x.ProjectId == id).ToListAsync();
        _context.Tasks.RemoveRange(tasks);

        var extraWorks = await _context.ExtraWorks.Where(x => x.ProjectId == id).ToListAsync();
        _context.ExtraWorks.RemoveRange(extraWorks);

        var workerPayments = await _context.WorkerPayments.Where(x => x.ProjectId == id).ToListAsync();
        _context.WorkerPayments.RemoveRange(workerPayments);

        var materialPurchases = await _context.MaterialPurchases.Where(x => x.ProjectId == id).ToListAsync();
        _context.MaterialPurchases.RemoveRange(materialPurchases);

        var expenses = await _context.Expenses.Where(x => x.ProjectId == id).ToListAsync();
        _context.Expenses.RemoveRange(expenses);

        var payments = await _context.Payments.Where(x => x.ProjectId == id).ToListAsync();
        _context.Payments.RemoveRange(payments);

        var stages = await _context.ProjectStages.Where(x => x.ProjectId == id).ToListAsync();
        _context.ProjectStages.RemoveRange(stages);

        var members = await _context.ProjectMembers.Where(x => x.ProjectId == id).ToListAsync();
        _context.ProjectMembers.RemoveRange(members);

        _context.Projects.Remove(project);
        await _context.SaveChangesAsync();
    }

    private static ProjectDto MapToDto(Project p) => new()
    {
        Id = p.Id,
        Name = p.Name,
        Description = p.Description,
        ProjectType = p.ProjectType,
        CustomerId = p.CustomerId,
        CustomerName = p.Customer?.FullName ?? "",
        ContractAmount = p.ContractAmount,
        Budget = p.Budget,
        Currency = p.Currency,
        StartDate = p.StartDate,
        EndDate = p.EndDate,
        ActualEndDate = p.ActualEndDate,
        Status = p.Status,
        StatusName = p.Status.ToString(),
        ProgressPercent = p.ProgressPercent,
        Location = p.Location,
        Notes = p.Notes,
        CreatedByUserId = p.CreatedByUserId,
        CreatedByName = p.CreatedByUser?.FullName ?? "",
        MemberCount = p.Members?.Count ?? 0,
        StageCount = p.Stages?.Count ?? 0,
        CompletedStageCount = p.Stages?.Count(s => s.IsCompleted) ?? 0,
        CreatedAt = p.CreatedAt,
        UpdatedAt = p.UpdatedAt,
        Block = p.Block,
        ApartmentNumber = p.ApartmentNumber,
        AreaM2 = p.AreaM2,
        PrepaymentPercent = p.PrepaymentPercent,
        IntermediatePercent = p.IntermediatePercent,
        FinalPercent = p.FinalPercent,
        ExchangeRate = p.ExchangeRate,
        AgreementId = p.AgreementId
    };

    private static ProjectStageDto MapStageToDto(ProjectStage s) => new()
    {
        Id = s.Id,
        Name = s.Name,
        Description = s.Description,
        OrderIndex = s.OrderIndex,
        IsCompleted = s.IsCompleted,
        CompletedAt = s.CompletedAt,
        CreatedAt = s.CreatedAt
    };
}

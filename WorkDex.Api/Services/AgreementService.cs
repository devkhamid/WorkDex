using Microsoft.EntityFrameworkCore;
using WorkDex.Api.Data;
using WorkDex.Api.DTOs.Agreements;
using WorkDex.Api.DTOs.Projects;
using WorkDex.Api.Models;

namespace WorkDex.Api.Services;

public class AgreementService : IAgreementService
{
    private readonly AppDbContext _context;
    private readonly IProjectService _projectService;

    public AgreementService(AppDbContext context, IProjectService projectService)
    {
        _context = context;
        _projectService = projectService;
    }

    public async Task<List<AgreementDto>> GetAllAsync(Guid requestingUserId, UserRole requestingUserRole)
    {
        var query = _context.Agreements
            .Include(a => a.Customer)
            .AsQueryable();

        if (requestingUserRole == UserRole.SuperAdmin)
        {
            // barchasi
        }
        else if (requestingUserRole == UserRole.Admin)
        {
            query = query.Where(a => a.CompanyAdminId == requestingUserId);
        }
        else
        {
            var user = await _context.Users.FindAsync(requestingUserId);
            var adminId = user?.CompanyAdminId ?? requestingUserId;
            query = query.Where(a => a.CompanyAdminId == adminId);
        }

        var list = await query.OrderByDescending(a => a.CreatedAt).ToListAsync();
        return list.Select(MapToDto).ToList();
    }

    public async Task<AgreementDto?> GetByIdAsync(Guid id)
    {
        var a = await _context.Agreements.Include(x => x.Customer).FirstOrDefaultAsync(x => x.Id == id);
        return a == null ? null : MapToDto(a);
    }

    public async Task<AgreementDto> CreateAsync(CreateAgreementDto dto, Guid createdByUserId, UserRole role)
    {
        Guid? companyAdminId = null;
        if (role == UserRole.Admin)
            companyAdminId = createdByUserId;
        else if (role != UserRole.SuperAdmin)
        {
            var user = await _context.Users.FindAsync(createdByUserId);
            companyAdminId = user?.CompanyAdminId;
        }

        Guid? customerId = dto.CustomerId;
        if (customerId == null && !string.IsNullOrWhiteSpace(dto.CustomerFullName))
        {
            var newCustomer = new Customer
            {
                Id = Guid.NewGuid(),
                FullName = dto.CustomerFullName.Trim(),
                PassportSeries = dto.CustomerPassportSeries?.Trim(),
                Address = dto.CustomerAddress?.Trim() ?? dto.ObjectAddress?.Trim(),
                PhoneNumber = !string.IsNullOrWhiteSpace(dto.CustomerPhone) ? dto.CustomerPhone.Trim() : "+998",
                CompanyAdminId = companyAdminId,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };
            _context.Customers.Add(newCustomer);
            await _context.SaveChangesAsync();
            customerId = newCustomer.Id;
        }
        else if (customerId.HasValue && !string.IsNullOrWhiteSpace(dto.CustomerPassportSeries))
        {
            var existing = await _context.Customers.FindAsync(customerId.Value);
            if (existing != null && string.IsNullOrWhiteSpace(existing.PassportSeries))
            {
                existing.PassportSeries = dto.CustomerPassportSeries.Trim();
                await _context.SaveChangesAsync();
            }
        }

        var agreement = new Agreement
        {
            ContractNumber = dto.ContractNumber,
            Day = dto.Day,
            Month = dto.Month,
            Year = dto.Year,
            ProjectName = dto.ProjectName,
            CustomerId = customerId,
            ObjectAddress = dto.ObjectAddress,
            Block = dto.Block,
            ApartmentNumber = dto.ApartmentNumber,
            AreaM2 = dto.AreaM2,
            TotalAmountUZS = dto.TotalAmountUZS,
            PrepaymentPercent = dto.PrepaymentPercent,
            IntermediatePercent = dto.IntermediatePercent,
            FinalPercent = dto.FinalPercent,
            Status = AgreementStatus.Active,
            CompanyAdminId = companyAdminId,
            CreatedByUserId = createdByUserId,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        _context.Agreements.Add(agreement);
        await _context.SaveChangesAsync();
        await _context.Entry(agreement).Reference(a => a.Customer).LoadAsync();
        return MapToDto(agreement);
    }

    public async Task<AgreementDto> UpdateAsync(Guid id, UpdateAgreementDto dto)
    {
        var agreement = await _context.Agreements.Include(a => a.Customer).FirstOrDefaultAsync(a => a.Id == id)
            ?? throw new KeyNotFoundException("Shartnoma topilmadi");

        Guid? customerId = dto.CustomerId;
        if (customerId == null && !string.IsNullOrWhiteSpace(dto.CustomerFullName))
        {
            var newCustomer = new Customer
            {
                Id = Guid.NewGuid(),
                FullName = dto.CustomerFullName.Trim(),
                PassportSeries = dto.CustomerPassportSeries?.Trim(),
                Address = dto.CustomerAddress?.Trim() ?? dto.ObjectAddress?.Trim(),
                PhoneNumber = !string.IsNullOrWhiteSpace(dto.CustomerPhone) ? dto.CustomerPhone.Trim() : "+998",
                CompanyAdminId = agreement.CompanyAdminId,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };
            _context.Customers.Add(newCustomer);
            await _context.SaveChangesAsync();
            customerId = newCustomer.Id;
        }
        else if (customerId.HasValue && !string.IsNullOrWhiteSpace(dto.CustomerPassportSeries))
        {
            var existing = await _context.Customers.FindAsync(customerId.Value);
            if (existing != null && string.IsNullOrWhiteSpace(existing.PassportSeries))
            {
                existing.PassportSeries = dto.CustomerPassportSeries.Trim();
                await _context.SaveChangesAsync();
            }
        }

        agreement.ContractNumber = dto.ContractNumber;
        agreement.Day = dto.Day;
        agreement.Month = dto.Month;
        agreement.Year = dto.Year;
        agreement.ProjectName = dto.ProjectName;
        agreement.CustomerId = customerId;
        agreement.ObjectAddress = dto.ObjectAddress;
        agreement.Block = dto.Block;
        agreement.ApartmentNumber = dto.ApartmentNumber;
        agreement.AreaM2 = dto.AreaM2;
        agreement.TotalAmountUZS = dto.TotalAmountUZS;
        agreement.PrepaymentPercent = dto.PrepaymentPercent;
        agreement.IntermediatePercent = dto.IntermediatePercent;
        agreement.FinalPercent = dto.FinalPercent;
        agreement.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();
        await _context.Entry(agreement).Reference(a => a.Customer).LoadAsync();
        return MapToDto(agreement);
    }

    public async Task<AgreementDto> FinalizeAsync(Guid id, FinalizeAgreementDto dto, Guid createdByUserId)
    {
        var agreement = await _context.Agreements.Include(a => a.Customer).FirstOrDefaultAsync(a => a.Id == id)
            ?? throw new KeyNotFoundException("Shartnoma topilmadi");

        // Agar mijoz belgilanmagan bo'lsa yoki bazadan o'chirilgan bo'lsa, avtomatik yaratamiz
        if (!agreement.CustomerId.HasValue || !await _context.Customers.AnyAsync(c => c.Id == agreement.CustomerId.Value))
        {
            var fallbackCustomer = new Customer
            {
                Id = Guid.NewGuid(),
                FullName = string.IsNullOrWhiteSpace(agreement.Customer?.FullName) ? agreement.ProjectName + " Buyurtmachisi" : agreement.Customer.FullName,
                PhoneNumber = "+998",
                CompanyAdminId = agreement.CompanyAdminId,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };
            _context.Customers.Add(fallbackCustomer);
            await _context.SaveChangesAsync();
            agreement.CustomerId = fallbackCustomer.Id;
        }

        agreement.ExchangeRate = dto.ExchangeRate;

        // Loyiha yaratish
        decimal totalUsd = dto.ExchangeRate > 0 ? agreement.TotalAmountUZS / dto.ExchangeRate : 0;
        var createProjectDto = new CreateProjectDto
        {
            Name = agreement.ProjectName,
            CustomerId = agreement.CustomerId.Value,
            ContractAmount = totalUsd,
            Budget = totalUsd,
            Currency = "USD",
            Location = agreement.ObjectAddress ?? "",
            StartDate = DateTime.UtcNow,
            EndDate = dto.Deadline,
        };

        var project = await _projectService.CreateAsync(createProjectDto, createdByUserId);

        // Loyiha maydonlarini yangilash
        var projectEntity = await _context.Projects.FindAsync(project.Id);
        if (projectEntity != null)
        {
            projectEntity.Block = agreement.Block;
            projectEntity.ApartmentNumber = agreement.ApartmentNumber;
            projectEntity.AreaM2 = agreement.AreaM2;
            projectEntity.PrepaymentPercent = agreement.PrepaymentPercent;
            projectEntity.IntermediatePercent = agreement.IntermediatePercent;
            projectEntity.FinalPercent = agreement.FinalPercent;
            projectEntity.ExchangeRate = agreement.ExchangeRate;
            projectEntity.AgreementId = agreement.Id;
        }

        // Menejerlarni qo'shish
        foreach (var managerId in dto.ManagerIds)
        {
            var member = new ProjectMember
            {
                ProjectId = project.Id,
                UserId = managerId,
                RoleInProject = UserRole.ProjectManager,
                AssignedAt = DateTime.UtcNow
            };
            _context.ProjectMembers.Add(member);
        }

        agreement.ProjectId = project.Id;
        agreement.Status = AgreementStatus.ProjectCreated;
        agreement.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();
        return MapToDto(agreement);
    }

    public async Task DeleteAsync(Guid id)
    {
        var agreement = await _context.Agreements.FindAsync(id)
            ?? throw new KeyNotFoundException("Shartnoma topilmadi");
        _context.Agreements.Remove(agreement);
        await _context.SaveChangesAsync();
    }

    public async Task<int> GetNextContractNumberAsync(Guid? companyAdminId)
    {
        var query = _context.Agreements.AsQueryable();
        if (companyAdminId.HasValue)
            query = query.Where(a => a.CompanyAdminId == companyAdminId);
        var maxNum = await query.MaxAsync(a => (int?)a.ContractNumber) ?? 0;
        return maxNum + 1;
    }

    private static AgreementDto MapToDto(Agreement a) => new()
    {
        Id = a.Id,
        ContractNumber = a.ContractNumber,
        Day = a.Day,
        Month = a.Month,
        Year = a.Year,
        ProjectName = a.ProjectName,
        CustomerId = a.CustomerId,
        CustomerFullName = a.Customer?.FullName,
        CustomerPhone = a.Customer?.PhoneNumber,
        CustomerPassportSeries = a.Customer?.PassportSeries,
        CustomerAddress = a.Customer?.Address,
        ObjectAddress = a.ObjectAddress,
        Block = a.Block,
        ApartmentNumber = a.ApartmentNumber,
        AreaM2 = a.AreaM2,
        TotalAmountUZS = a.TotalAmountUZS,
        PrepaymentPercent = a.PrepaymentPercent,
        IntermediatePercent = a.IntermediatePercent,
        FinalPercent = a.FinalPercent,
        ExchangeRate = a.ExchangeRate,
        ProjectId = a.ProjectId,
        Status = a.Status.ToString(),
        StatusCode = (int)a.Status,
        CompanyAdminId = a.CompanyAdminId,
        CreatedAt = a.CreatedAt,
        UpdatedAt = a.UpdatedAt
    };
}


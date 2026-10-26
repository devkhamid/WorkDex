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

        if (requestingUserRole != UserRole.SuperAdmin)
        {
            var user = await _context.Users.FindAsync(requestingUserId);
            var adminId = user?.CompanyAdminId ?? requestingUserId;
            query = ApplyTenantScope(query, adminId);
        }

        var list = await query.OrderByDescending(a => a.CreatedAt).ToListAsync();
        return list.Select(MapToDto).ToList();
    }

    public async Task<AgreementDto?> GetByIdAsync(Guid id, Guid requestingUserId, UserRole requestingUserRole)
    {
        var companyAdminId = requestingUserRole == UserRole.SuperAdmin
            ? (Guid?)null
            : await GetCompanyAdminIdAsync(requestingUserId);
        var query = _context.Agreements
            .Include(x => x.Customer)
            .AsQueryable();
        if (requestingUserRole != UserRole.SuperAdmin)
            query = ApplyTenantScope(query, companyAdminId!.Value);
        var a = await query.FirstOrDefaultAsync(x => x.Id == id);
        return a == null ? null : MapToDto(a);
    }

    public async Task<AgreementDto> CreateAsync(CreateAgreementDto dto, Guid createdByUserId, UserRole role)
    {
        Guid? companyAdminId = null;
        if (role != UserRole.SuperAdmin)
        {
            var user = await _context.Users.FindAsync(createdByUserId);
            if (user is null)
                throw new UnauthorizedAccessException("Foydalanuvchi topilmadi.");
            companyAdminId = user.CompanyAdminId ?? createdByUserId;
        }

        Guid? customerId = dto.CustomerId;
        if (customerId.HasValue)
            await EnsureCustomerAccessAsync(customerId.Value, companyAdminId);
        if (customerId == null)
        {
            if (dto.ClientType == (int)ClientType.LegalEntity && !string.IsNullOrWhiteSpace(dto.CompanyName))
            {
                var newCustomer = new Customer
                {
                    Id = Guid.NewGuid(),
                    FullName = dto.CompanyName.Trim(),
                    Address = dto.LegalAddress?.Trim() ?? dto.ObjectAddress?.Trim(),
                    PhoneNumber = !string.IsNullOrWhiteSpace(dto.CustomerPhone) ? dto.CustomerPhone.Trim() : "+998",
                    Notes = $"Директор: {dto.DirectorName}, ИНН: {dto.Inn}",
                    CompanyAdminId = companyAdminId,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                };
                _context.Customers.Add(newCustomer);
                await _context.SaveChangesAsync();
                customerId = newCustomer.Id;
            }
            else if (!string.IsNullOrWhiteSpace(dto.CustomerFullName))
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
            ClientType = (ClientType)dto.ClientType,
            CustomerId = customerId,
            CompanyName = dto.CompanyName,
            DirectorName = dto.DirectorName,
            DirectorTitle = string.IsNullOrWhiteSpace(dto.DirectorTitle) ? "Ген. директора" : dto.DirectorTitle,
            FoundationDoc = string.IsNullOrWhiteSpace(dto.FoundationDoc) ? "Устава" : dto.FoundationDoc,
            LegalAddress = dto.LegalAddress,
            Inn = dto.Inn,
            BankAccount = dto.BankAccount,
            BankName = dto.BankName,
            Mfo = dto.Mfo,
            SecondBankName = dto.SecondBankName,
            SecondBankAccount = dto.SecondBankAccount,
            SecondMfo = dto.SecondMfo,
            Oked = dto.Oked,
            Okpo = dto.Okpo,
            NdsRegNumber = dto.NdsRegNumber,
            ContractorCompanyName = dto.ContractorCompanyName,
            ContractorDirectorName = dto.ContractorDirectorName,
            ContractorAddress = dto.ContractorAddress,
            ContractorBankAccount = dto.ContractorBankAccount,
            ContractorBankName = dto.ContractorBankName,
            ContractorMfo = dto.ContractorMfo,
            ContractorInn = dto.ContractorInn,
            ContractorPhone = dto.ContractorPhone,
            ObjectAddress = string.IsNullOrWhiteSpace(dto.ObjectAddress) ? "г. Ташкент, Яккасарайский район, улица, дом 133" : dto.ObjectAddress.Trim(),
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

    public async Task<AgreementDto> UpdateAsync(Guid id, UpdateAgreementDto dto, Guid requestingUserId, UserRole requestingUserRole)
    {
        var companyAdminId = requestingUserRole == UserRole.SuperAdmin
            ? (Guid?)null
            : await GetCompanyAdminIdAsync(requestingUserId);
        var query = _context.Agreements
            .Include(a => a.Customer)
            .AsQueryable();
        if (requestingUserRole != UserRole.SuperAdmin)
            query = ApplyTenantScope(query, companyAdminId!.Value);
        var agreement = await query.FirstOrDefaultAsync(a => a.Id == id)
            ?? throw new KeyNotFoundException("Shartnoma topilmadi");

        Guid? customerId = dto.CustomerId;
        if (customerId.HasValue)
            await EnsureCustomerAccessAsync(customerId.Value, requestingUserRole == UserRole.SuperAdmin ? null : agreement.CompanyAdminId);
        if (customerId == null)
        {
            if (dto.ClientType == (int)ClientType.LegalEntity && !string.IsNullOrWhiteSpace(dto.CompanyName))
            {
                var newCustomer = new Customer
                {
                    Id = Guid.NewGuid(),
                    FullName = dto.CompanyName.Trim(),
                    Address = dto.LegalAddress?.Trim() ?? dto.ObjectAddress?.Trim(),
                    PhoneNumber = !string.IsNullOrWhiteSpace(dto.CustomerPhone) ? dto.CustomerPhone.Trim() : "+998",
                    Notes = $"Директор: {dto.DirectorName}, ИНН: {dto.Inn}",
                    CompanyAdminId = agreement.CompanyAdminId,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                };
                _context.Customers.Add(newCustomer);
                await _context.SaveChangesAsync();
                customerId = newCustomer.Id;
            }
            else if (!string.IsNullOrWhiteSpace(dto.CustomerFullName))
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
        agreement.ClientType = (ClientType)dto.ClientType;
        agreement.CustomerId = customerId;
        agreement.CompanyName = dto.CompanyName;
        agreement.DirectorName = dto.DirectorName;
        agreement.DirectorTitle = string.IsNullOrWhiteSpace(dto.DirectorTitle) ? "Ген. директора" : dto.DirectorTitle;
        agreement.FoundationDoc = string.IsNullOrWhiteSpace(dto.FoundationDoc) ? "Устава" : dto.FoundationDoc;
        agreement.LegalAddress = dto.LegalAddress;
        agreement.Inn = dto.Inn;
        agreement.BankAccount = dto.BankAccount;
        agreement.BankName = dto.BankName;
        agreement.Mfo = dto.Mfo;
        agreement.SecondBankName = dto.SecondBankName;
        agreement.SecondBankAccount = dto.SecondBankAccount;
        agreement.SecondMfo = dto.SecondMfo;
        agreement.Oked = dto.Oked;
        agreement.Okpo = dto.Okpo;
        agreement.NdsRegNumber = dto.NdsRegNumber;
        agreement.ContractorCompanyName = dto.ContractorCompanyName;
        agreement.ContractorDirectorName = dto.ContractorDirectorName;
        agreement.ContractorAddress = dto.ContractorAddress;
        agreement.ContractorBankAccount = dto.ContractorBankAccount;
        agreement.ContractorBankName = dto.ContractorBankName;
        agreement.ContractorMfo = dto.ContractorMfo;
        agreement.ContractorInn = dto.ContractorInn;
        agreement.ContractorPhone = dto.ContractorPhone;
        agreement.ObjectAddress = string.IsNullOrWhiteSpace(dto.ObjectAddress) ? "г. Ташкент, Яккасарайский район, улица, дом 133" : dto.ObjectAddress.Trim();
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

    public async Task<AgreementDto> FinalizeAsync(Guid id, FinalizeAgreementDto dto, Guid createdByUserId, UserRole requestingUserRole)
    {
        var projectName = dto.ProjectName?.Trim();
        if (string.IsNullOrEmpty(projectName))
            throw new ArgumentException("Loyiha nomini kiriting.");

        var companyAdminId = requestingUserRole == UserRole.SuperAdmin
            ? (Guid?)null
            : await GetCompanyAdminIdAsync(createdByUserId);
        var query = _context.Agreements
            .Include(a => a.Customer)
            .AsQueryable();
        if (requestingUserRole != UserRole.SuperAdmin)
            query = ApplyTenantScope(query, companyAdminId!.Value);
        var agreement = await query.FirstOrDefaultAsync(a => a.Id == id)
            ?? throw new KeyNotFoundException("Shartnoma topilmadi");

        var managerIds = dto.ManagerIds.Distinct().ToList();
        if (managerIds.Count > 0)
        {
            var eligibleManagerCount = await _context.Users.CountAsync(user =>
                managerIds.Contains(user.Id)
                && user.Role == UserRole.ProjectManager
                && user.IsActive
                && (requestingUserRole == UserRole.SuperAdmin || user.CompanyAdminId == companyAdminId));
            if (eligibleManagerCount != managerIds.Count)
                throw new KeyNotFoundException("Tanlangan menejerlardan biri topilmadi.");
        }

        var customerExists = agreement.CustomerId.HasValue
            && await _context.Customers.AnyAsync(c => c.Id == agreement.CustomerId.Value);
        if (customerExists)
        {
            await EnsureCustomerAccessAsync(
                agreement.CustomerId!.Value,
                requestingUserRole == UserRole.SuperAdmin ? null : agreement.CompanyAdminId);
        }
        else
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

        var createProjectDto = new CreateProjectDto
        {
            Name = projectName,
            CustomerId = agreement.CustomerId.Value,
            ContractAmount = agreement.TotalAmountUZS,
            Budget = agreement.TotalAmountUZS,
            Currency = "UZS",
            Location = agreement.ObjectAddress ?? "",
            StartDate = DateTime.UtcNow,
            EndDate = dto.Deadline,
        };

        var project = await _projectService.CreateAsync(createProjectDto, createdByUserId);
        agreement.ExchangeRate = project.ExchangeRate;

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
            if (agreement.TotalAmountUZS > 0)
                projectEntity.ContractAmountUzs = agreement.TotalAmountUZS;
        }

        foreach (var managerId in managerIds)
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

    public async Task DeleteAsync(Guid id, Guid requestingUserId, UserRole requestingUserRole)
    {
        var companyAdminId = requestingUserRole == UserRole.SuperAdmin
            ? (Guid?)null
            : await GetCompanyAdminIdAsync(requestingUserId);
        var query = _context.Agreements.AsQueryable();
        if (requestingUserRole != UserRole.SuperAdmin)
            query = ApplyTenantScope(query, companyAdminId!.Value);
        var agreement = await query.FirstOrDefaultAsync(a => a.Id == id)
            ?? throw new KeyNotFoundException("Shartnoma topilmadi");
        _context.Agreements.Remove(agreement);
        await _context.SaveChangesAsync();
    }

    private async Task<Guid> GetCompanyAdminIdAsync(Guid userId)
    {
        var user = await _context.Users.AsNoTracking().FirstOrDefaultAsync(u => u.Id == userId)
            ?? throw new UnauthorizedAccessException("Foydalanuvchi topilmadi.");
        return user.CompanyAdminId ?? user.Id;
    }

    private IQueryable<Agreement> ApplyTenantScope(IQueryable<Agreement> query, Guid companyAdminId)
    {
        return query.Where(agreement =>
            agreement.CompanyAdminId == companyAdminId
            && (!agreement.CustomerId.HasValue
                || _context.Customers.Any(customer =>
                    customer.Id == agreement.CustomerId && customer.CompanyAdminId == companyAdminId))
            && (!agreement.ProjectId.HasValue
                || _context.Projects.Any(project =>
                    project.Id == agreement.ProjectId && project.CompanyAdminId == companyAdminId)));
    }

    private async Task EnsureCustomerAccessAsync(Guid customerId, Guid? companyAdminId)
    {
        var query = _context.Customers.Where(customer => customer.Id == customerId);
        if (companyAdminId.HasValue)
            query = query.Where(customer => customer.CompanyAdminId == companyAdminId);

        if (!await query.AnyAsync())
            throw new KeyNotFoundException("Mijoz topilmadi.");
    }

    public async Task<int> GetNextContractNumberAsync(Guid userId, UserRole role)
    {
        Guid? companyAdminId = role == UserRole.SuperAdmin
            ? null
            : await GetCompanyAdminIdAsync(userId);

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
        ClientType = (int)a.ClientType,
        ClientTypeName = a.ClientType.ToString(),
        CustomerId = a.CustomerId,
        CustomerFullName = a.Customer?.FullName ?? (a.ClientType == ClientType.LegalEntity ? a.CompanyName : null),
        CustomerPhone = a.Customer?.PhoneNumber,
        CustomerPassportSeries = a.Customer?.PassportSeries,
        CustomerAddress = a.Customer?.Address ?? (a.ClientType == ClientType.LegalEntity ? a.LegalAddress : null),
        CompanyName = a.CompanyName,
        DirectorName = a.DirectorName,
        DirectorTitle = a.DirectorTitle,
        FoundationDoc = a.FoundationDoc,
        LegalAddress = a.LegalAddress,
        Inn = a.Inn,
        BankAccount = a.BankAccount,
        BankName = a.BankName,
        Mfo = a.Mfo,
        SecondBankName = a.SecondBankName,
        SecondBankAccount = a.SecondBankAccount,
        SecondMfo = a.SecondMfo,
        Oked = a.Oked,
        Okpo = a.Okpo,
        NdsRegNumber = a.NdsRegNumber,
        ContractorCompanyName = a.ContractorCompanyName,
        ContractorDirectorName = a.ContractorDirectorName,
        ContractorAddress = a.ContractorAddress,
        ContractorBankAccount = a.ContractorBankAccount,
        ContractorBankName = a.ContractorBankName,
        ContractorMfo = a.ContractorMfo,
        ContractorInn = a.ContractorInn,
        ContractorPhone = a.ContractorPhone,
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

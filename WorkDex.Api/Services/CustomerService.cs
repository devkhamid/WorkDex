using Microsoft.EntityFrameworkCore;
using WorkDex.Api.Data;
using WorkDex.Api.DTOs.Customers;
using WorkDex.Api.Models;

namespace WorkDex.Api.Services;

public class CustomerService : ICustomerService
{
    private readonly AppDbContext _context;

    public CustomerService(AppDbContext context)
    {
        _context = context;
    }

    public async Task<List<CustomerDto>> GetAllAsync(Guid requestingUserId, UserRole requestingUserRole)
    {
        var query = _context.Customers
            .Include(c => c.Projects)
            .AsQueryable();

        if (requestingUserRole == UserRole.SuperAdmin)
        {
            // SuperAdmin barcha mijozlarni ko'radi
        }
        else if (requestingUserRole == UserRole.Admin)
        {
            query = query.Where(c => c.CompanyAdminId == requestingUserId);
        }
        else
        {
            var user = await _context.Users.FindAsync(requestingUserId);
            var targetCompanyAdminId = user?.CompanyAdminId ?? requestingUserId;
            query = query.Where(c => c.CompanyAdminId == targetCompanyAdminId);
        }

        var customers = await query
            .OrderBy(c => c.FullName)
            .ToListAsync();

        return customers.Select(MapToDto).ToList();
    }

    public async Task<CustomerDto> GetByIdAsync(Guid id, Guid requestingUserId, UserRole requestingUserRole)
    {
        var customer = await _context.Customers
            .Include(c => c.Projects)
            .FirstOrDefaultAsync(c => c.Id == id);

        if (customer is null)
            throw new KeyNotFoundException("Mijoz topilmadi.");

        await EnsureSameCompanyAsync(customer, requestingUserId, requestingUserRole);
        return MapToDto(customer);
    }

    public async Task<CustomerDto> CreateAsync(CreateCustomerDto dto, Guid createdByUserId)
    {
        var requestingUser = await _context.Users.FindAsync(createdByUserId);
        var companyAdminId = requestingUser?.Role == UserRole.Admin
            ? createdByUserId
            : (requestingUser?.CompanyAdminId ?? createdByUserId);

        var customer = new Customer
        {
            FullName = dto.FullName.Trim(),
            PhoneNumber = dto.PhoneNumber.Trim(),
            Email = dto.Email?.Trim(),
            Address = dto.Address?.Trim(),
            Notes = dto.Notes?.Trim(),
            CompanyAdminId = companyAdminId,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        _context.Customers.Add(customer);
        await _context.SaveChangesAsync();

        return MapToDto(customer);
    }

    public async Task<CustomerDto> UpdateAsync(Guid id, UpdateCustomerDto dto, Guid requestingUserId, UserRole requestingUserRole)
    {
        var customer = await _context.Customers
            .Include(c => c.Projects)
            .FirstOrDefaultAsync(c => c.Id == id);

        if (customer is null)
            throw new KeyNotFoundException("Mijoz topilmadi.");

        await EnsureSameCompanyAsync(customer, requestingUserId, requestingUserRole);

        customer.FullName = dto.FullName.Trim();
        customer.PhoneNumber = dto.PhoneNumber.Trim();
        customer.Email = dto.Email?.Trim();
        customer.Address = dto.Address?.Trim();
        customer.Notes = dto.Notes?.Trim();
        customer.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();
        return MapToDto(customer);
    }

    public async Task DeleteAsync(Guid id, Guid requestingUserId, UserRole requestingUserRole)
    {
        var customer = await _context.Customers
            .Include(c => c.Projects)
            .FirstOrDefaultAsync(c => c.Id == id);

        if (customer is null)
            throw new KeyNotFoundException("Mijoz topilmadi.");

        await EnsureSameCompanyAsync(customer, requestingUserId, requestingUserRole);

        // Loyihalari bo'lsa o'chirib bo'lmaydi — ma'lumot yo'qolmasligi uchun
        if (customer.Projects.Any())
            throw new InvalidOperationException(
                $"Bu mijozda {customer.Projects.Count} ta loyiha mavjud. Avval loyihalarni o'chirish yoki boshqa mijozga ko'chirish kerak.");

        _context.Customers.Remove(customer);
        await _context.SaveChangesAsync();
    }

    private async Task<Guid> ResolveCompanyAdminIdAsync(Guid requestingUserId, UserRole requestingUserRole)
    {
        if (requestingUserRole == UserRole.Admin) return requestingUserId;
        var user = await _context.Users.FindAsync(requestingUserId);
        return user?.CompanyAdminId ?? requestingUserId;
    }

    private async Task EnsureSameCompanyAsync(Customer customer, Guid requestingUserId, UserRole requestingUserRole)
    {
        if (requestingUserRole == UserRole.SuperAdmin) return;
        var companyAdminId = await ResolveCompanyAdminIdAsync(requestingUserId, requestingUserRole);
        if (customer.CompanyAdminId != companyAdminId)
            throw new KeyNotFoundException("Mijoz topilmadi.");
    }

    private static CustomerDto MapToDto(Customer customer) => new()
    {
        Id = customer.Id,
        FullName = customer.FullName,
        PhoneNumber = customer.PhoneNumber,
        Email = customer.Email,
        Address = customer.Address,
        Notes = customer.Notes,
        ProjectCount = customer.Projects?.Count ?? 0,
        CreatedAt = customer.CreatedAt,
        UpdatedAt = customer.UpdatedAt
    };
}

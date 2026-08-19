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

    public async Task<List<CustomerDto>> GetAllAsync()
    {
        var customers = await _context.Customers
            .Include(c => c.Projects)
            .OrderBy(c => c.FullName)
            .ToListAsync();

        return customers.Select(MapToDto).ToList();
    }

    public async Task<CustomerDto> GetByIdAsync(Guid id)
    {
        var customer = await _context.Customers
            .Include(c => c.Projects)
            .FirstOrDefaultAsync(c => c.Id == id);

        if (customer is null)
            throw new KeyNotFoundException("Mijoz topilmadi.");

        return MapToDto(customer);
    }

    public async Task<CustomerDto> CreateAsync(CreateCustomerDto dto)
    {
        var customer = new Customer
        {
            FullName = dto.FullName.Trim(),
            PhoneNumber = dto.PhoneNumber.Trim(),
            Email = dto.Email?.Trim(),
            Address = dto.Address?.Trim(),
            Notes = dto.Notes?.Trim(),
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        _context.Customers.Add(customer);
        await _context.SaveChangesAsync();

        return MapToDto(customer);
    }

    public async Task<CustomerDto> UpdateAsync(Guid id, UpdateCustomerDto dto)
    {
        var customer = await _context.Customers
            .Include(c => c.Projects)
            .FirstOrDefaultAsync(c => c.Id == id);

        if (customer is null)
            throw new KeyNotFoundException("Mijoz topilmadi.");

        customer.FullName = dto.FullName.Trim();
        customer.PhoneNumber = dto.PhoneNumber.Trim();
        customer.Email = dto.Email?.Trim();
        customer.Address = dto.Address?.Trim();
        customer.Notes = dto.Notes?.Trim();
        customer.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        return MapToDto(customer);
    }

    public async Task DeleteAsync(Guid id)
    {
        var customer = await _context.Customers
            .Include(c => c.Projects)
            .FirstOrDefaultAsync(c => c.Id == id);

        if (customer is null)
            throw new KeyNotFoundException("Mijoz topilmadi.");

        // Loyihalari bo'lsa o'chirib bo'lmaydi — ma'lumot yo'qolmasligi uchun
        if (customer.Projects.Any())
            throw new InvalidOperationException(
                $"Bu mijozda {customer.Projects.Count} ta loyiha mavjud. Avval loyihalarni o'chirish yoki boshqa mijozga ko'chirish kerak.");

        _context.Customers.Remove(customer);
        await _context.SaveChangesAsync();
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

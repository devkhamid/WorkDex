using WorkDex.Api.DTOs.Customers;
using WorkDex.Api.Models;

namespace WorkDex.Api.Services;

public interface ICustomerService
{
    Task<List<CustomerDto>> GetAllAsync(Guid requestingUserId, UserRole requestingUserRole);
    Task<CustomerDto> GetByIdAsync(Guid id, Guid requestingUserId, UserRole requestingUserRole);
    Task<CustomerDto> CreateAsync(CreateCustomerDto dto, Guid createdByUserId);
    Task<CustomerDto> UpdateAsync(Guid id, UpdateCustomerDto dto, Guid requestingUserId, UserRole requestingUserRole);
    Task DeleteAsync(Guid id, Guid requestingUserId, UserRole requestingUserRole);
}

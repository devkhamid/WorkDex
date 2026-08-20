using WorkDex.Api.DTOs.Customers;
using WorkDex.Api.Models;

namespace WorkDex.Api.Services;

public interface ICustomerService
{
    Task<List<CustomerDto>> GetAllAsync(Guid requestingUserId, UserRole requestingUserRole);
    Task<CustomerDto> GetByIdAsync(Guid id);
    Task<CustomerDto> CreateAsync(CreateCustomerDto dto, Guid createdByUserId);
    Task<CustomerDto> UpdateAsync(Guid id, UpdateCustomerDto dto);
    Task DeleteAsync(Guid id);
}

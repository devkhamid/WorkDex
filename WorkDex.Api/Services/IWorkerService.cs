using WorkDex.Api.DTOs.Workers;
using WorkDex.Api.Models;

namespace WorkDex.Api.Services;

public interface IWorkerService
{
    // Katalog operatsiyalari
    Task<List<WorkerDto>> GetAllWorkersAsync(Guid requestingUserId, UserRole requestingUserRole);
    Task<WorkerDto> GetWorkerByIdAsync(Guid id, Guid requestingUserId, UserRole requestingUserRole);
    Task<WorkerDto> CreateWorkerAsync(CreateWorkerDto dto, Guid createdByUserId);
    Task<WorkerDto> UpdateWorkerAsync(Guid id, CreateWorkerDto dto, Guid requestingUserId, UserRole requestingUserRole);
    Task DeleteWorkerAsync(Guid id, Guid requestingUserId, UserRole requestingUserRole);

    // Loyiha ustalari va Hakedişlar
    Task<WorkerPaymentDto> AddWorkerJobAsync(Guid projectId, CreateWorkerPaymentDto dto, Guid createdByUserId);
    Task<List<WorkerPaymentDto>> GetWorkerJobsByProjectAsync(Guid projectId);
    Task<WorkerPaymentDto> GetWorkerJobByIdAsync(Guid projectId, Guid paymentId);
    Task<WorkerPaymentDto> UpdateWorkAmountAsync(Guid projectId, Guid paymentId, UpdateWorkerWorkAmountDto dto);
    Task<WorkerPaymentDto> PayWorkerAsync(Guid projectId, Guid paymentId, PayWorkerDto dto);
    Task DeleteWorkerJobAsync(Guid projectId, Guid paymentId);
    Task<List<ProjectWorkerSummaryDto>> GetProjectWorkersSummaryAsync(Guid projectId);
}

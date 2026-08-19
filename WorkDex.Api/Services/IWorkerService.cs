using WorkDex.Api.DTOs.Workers;

namespace WorkDex.Api.Services;

public interface IWorkerService
{
    // Katalog operatsiyalari
    Task<List<WorkerDto>> GetAllWorkersAsync();
    Task<WorkerDto> GetWorkerByIdAsync(Guid id);
    Task<WorkerDto> CreateWorkerAsync(CreateWorkerDto dto);
    Task<WorkerDto> UpdateWorkerAsync(Guid id, CreateWorkerDto dto);
    Task DeleteWorkerAsync(Guid id);

    // Loyiha ustalari va Hakedişlar
    Task<WorkerPaymentDto> AddWorkerJobAsync(Guid projectId, CreateWorkerPaymentDto dto, Guid createdByUserId);
    Task<List<WorkerPaymentDto>> GetWorkerJobsByProjectAsync(Guid projectId);
    Task<WorkerPaymentDto> GetWorkerJobByIdAsync(Guid projectId, Guid paymentId);
    Task<WorkerPaymentDto> UpdateWorkAmountAsync(Guid projectId, Guid paymentId, UpdateWorkerWorkAmountDto dto);
    Task<WorkerPaymentDto> PayWorkerAsync(Guid projectId, Guid paymentId, PayWorkerDto dto);
    Task DeleteWorkerJobAsync(Guid projectId, Guid paymentId);
    Task<List<ProjectWorkerSummaryDto>> GetProjectWorkersSummaryAsync(Guid projectId);
}

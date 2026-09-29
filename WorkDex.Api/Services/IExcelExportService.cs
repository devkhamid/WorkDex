using WorkDex.Api.Models;

namespace WorkDex.Api.Services;

public interface IExcelExportService
{
    Task<byte[]> ExportProjectToExcelAsync(Guid projectId, Guid requestingUserId, UserRole requestingUserRole);
    Task<byte[]> ExportAllProjectsToExcelAsync(Guid requestingUserId, UserRole requestingUserRole);
    Task<byte[]> ExportAnnualReportAsync(int year, Guid requestingUserId, UserRole requestingUserRole);
}

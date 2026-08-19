namespace WorkDex.Api.Services;

public interface IExcelExportService
{
    Task<byte[]> ExportProjectToExcelAsync(Guid projectId);
    Task<byte[]> ExportAllProjectsToExcelAsync();
}

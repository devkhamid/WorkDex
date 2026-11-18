namespace WorkDex.Api.DTOs.Workers;

public class WorkerJobImportRowDto
{
    public int Row { get; set; }
    public Guid ProjectId { get; set; }
    public string ProjectName { get; set; } = string.Empty;
    public string Section { get; set; } = string.Empty;
    public string JobName { get; set; } = string.Empty;
    public string WorkerName { get; set; } = string.Empty;
    public bool IsNewWorker { get; set; }
    public decimal? Quantity { get; set; }
    public decimal? UnitPrice { get; set; }
    public decimal AmountUzs { get; set; }
}

public class WorkerJobImportProjectDto
{
    public Guid ProjectId { get; set; }
    public string ProjectName { get; set; } = string.Empty;
    public int Count { get; set; }
    public decimal AmountUzs { get; set; }
}

public class WorkerJobImportIssueDto
{
    public int Row { get; set; }
    public string? Name { get; set; }
    public string Message { get; set; } = string.Empty;
}

public class WorkerJobImportResultDto
{
    public bool DryRun { get; set; }
    public int Created { get; set; }
    public decimal TotalUzs { get; set; }
    public decimal TotalUsd { get; set; }
    public decimal ExchangeRate { get; set; }
    public List<string> NewWorkers { get; set; } = new();
    public List<WorkerJobImportProjectDto> Projects { get; set; } = new();
    public List<WorkerJobImportRowDto> Rows { get; set; } = new();
    public List<WorkerJobImportIssueDto> Errors { get; set; } = new();
    public List<string> Warnings { get; set; } = new();
}

using ClosedXML.Excel;
using Microsoft.EntityFrameworkCore;
using WorkDex.Api.Data;
using WorkDex.Api.Models;

namespace WorkDex.Api.Services;

public class ExcelExportService : IExcelExportService
{
    private readonly AppDbContext _context;

    public ExcelExportService(AppDbContext context)
    {
        _context = context;
    }

    public async Task<byte[]> ExportProjectToExcelAsync(Guid projectId)
    {
        var project = await _context.Projects
            .Include(p => p.Customer)
            .Include(p => p.CreatedByUser)
            .Include(p => p.Stages)
            .Include(p => p.Tasks)
                .ThenInclude(t => t.Stage)
            .Include(p => p.MaterialPurchases)
                .ThenInclude(mp => mp.Material)
            .Include(p => p.WorkerPayments)
                .ThenInclude(wp => wp.Worker)
            .Include(p => p.ExtraWorks)
            .FirstOrDefaultAsync(p => p.Id == projectId);

        if (project is null)
            throw new KeyNotFoundException("Loyiha topilmadi.");

        var payments = await _context.Payments
            .Include(p => p.ReceivedByUser)
            .Where(p => p.ProjectId == projectId)
            .OrderBy(p => p.PaymentDate)
            .ToListAsync();

        var expenses = await _context.Expenses
            .Include(e => e.CreatedByUser)
            .Where(e => e.ProjectId == projectId)
            .OrderBy(e => e.ExpenseDate)
            .ToListAsync();

        using var workbook = new XLWorkbook();

        // 1. Loyiha umumiy ma'lumotlari
        BuildOverviewSheet(workbook, project);

        // 2. Mijoz to'lovlari
        BuildPaymentsSheet(workbook, payments, project.Currency);

        // 3. Xarajatlar
        BuildExpensesSheet(workbook, expenses, project.Currency);

        // 4. Materiallar xaridi
        BuildMaterialsSheet(workbook, project.MaterialPurchases.ToList(), project.Currency);

        // 5. Usta va ish haqlari
        BuildWorkersSheet(workbook, project.WorkerPayments.ToList(), project.Currency);

        // 6. Qo'shimcha ishlar
        BuildExtraWorksSheet(workbook, project.ExtraWorks.ToList(), project.Currency);

        // 7. Vazifalar va progress
        BuildTasksSheet(workbook, project.Tasks.ToList());

        // 8. Moliyaviy xulosa
        BuildFinancialSummarySheet(workbook, project, payments, expenses);

        // 9. Barcha loyihalar konsolidatsiyasi
        var allProjects = await _context.Projects.Include(p => p.Customer).ToListAsync();
        BuildAllProjectsSheet(workbook, allProjects);

        using var stream = new MemoryStream();
        workbook.SaveAs(stream);
        return stream.ToArray();
    }

    public async Task<byte[]> ExportAllProjectsToExcelAsync()
    {
        var allProjects = await _context.Projects
            .Include(p => p.Customer)
            .Include(p => p.CreatedByUser)
            .OrderByDescending(p => p.CreatedAt)
            .ToListAsync();

        var allPayments = await _context.Payments.ToListAsync();
        var allExpenses = await _context.Expenses.ToListAsync();
        var allPurchases = await _context.MaterialPurchases.ToListAsync();
        var allWorkerPayments = await _context.WorkerPayments.ToListAsync();
        var allExtraWorks = await _context.ExtraWorks.ToListAsync();

        using var workbook = new XLWorkbook();
        var ws = workbook.Worksheets.Add("Barcha Loyihalar");

        // Headers
        var headers = new[]
        {
            "№", "Loyiha Nomi", "Loyiha Turi", "Mijoz", "Status", "Progress %",
            "Shartnoma Summasi", "Byudjet", "Valyuta", "Olingan Tushum", "Qoldiq Tushum",
            "Jami Xarajatlar", "Kutilayotgan Foyda", "Boshlanish Sanasi", "Tugash Sanasi"
        };

        for (int i = 0; i < headers.Length; i++)
        {
            ws.Cell(1, i + 1).Value = headers[i];
            ws.Cell(1, i + 1).Style.Font.Bold = true;
            ws.Cell(1, i + 1).Style.Fill.BackgroundColor = XLColor.FromHtml("#1E3A8A");
            ws.Cell(1, i + 1).Style.Font.FontColor = XLColor.White;
        }

        int row = 2;
        int index = 1;
        foreach (var p in allProjects)
        {
            var pPayments = allPayments.Where(x => x.ProjectId == p.Id).Sum(x => x.Amount);
            var pExtraIncome = allExtraWorks.Where(x => x.ProjectId == p.Id && x.IsApprovedByCustomer).Sum(x => x.CustomerAmount);
            var pTotalContract = p.ContractAmount + pExtraIncome;
            var pPending = pTotalContract - pPayments;

            var pMatExp = allPurchases.Where(x => x.ProjectId == p.Id).Sum(x => x.TotalCost)
                + allExpenses.Where(x => x.ProjectId == p.Id && x.Category == ExpenseCategory.Material).Sum(x => x.Amount);
            var pLabExp = allWorkerPayments.Where(x => x.ProjectId == p.Id).Sum(x => x.PaidAmount)
                + allExpenses.Where(x => x.ProjectId == p.Id && x.Category == ExpenseCategory.Labor).Sum(x => x.Amount);
            var pOthExp = allExpenses.Where(x => x.ProjectId == p.Id && x.Category != ExpenseCategory.Material && x.Category != ExpenseCategory.Labor).Sum(x => x.Amount);
            var pExtraCost = allExtraWorks.Where(x => x.ProjectId == p.Id && x.IsApprovedByCustomer).Sum(x => x.ActualCost);
            var pTotalExp = pMatExp + pLabExp + pOthExp + pExtraCost;
            var pProfit = pTotalContract - pTotalExp;

            ws.Cell(row, 1).Value = index++;
            ws.Cell(row, 2).Value = p.Name;
            ws.Cell(row, 3).Value = p.ProjectType ?? "-";
            ws.Cell(row, 4).Value = p.Customer?.FullName ?? "-";
            ws.Cell(row, 5).Value = p.Status.ToString();
            ws.Cell(row, 6).Value = p.ProgressPercent + "%";
            ws.Cell(row, 7).Value = pTotalContract;
            ws.Cell(row, 8).Value = p.Budget;
            ws.Cell(row, 9).Value = p.Currency;
            ws.Cell(row, 10).Value = pPayments;
            ws.Cell(row, 11).Value = pPending;
            ws.Cell(row, 12).Value = pTotalExp;
            ws.Cell(row, 13).Value = pProfit;
            ws.Cell(row, 14).Value = p.StartDate.ToString("dd.MM.yyyy");
            ws.Cell(row, 15).Value = p.EndDate?.ToString("dd.MM.yyyy") ?? "-";

            row++;
        }

        ws.Columns().AdjustToContents();

        using var stream = new MemoryStream();
        workbook.SaveAs(stream);
        return stream.ToArray();
    }

    private static void BuildOverviewSheet(XLWorkbook wb, Project p)
    {
        var ws = wb.Worksheets.Add("1. Loyiha haqida");

        ws.Cell(1, 1).Value = "WORKDEX — LOYIHA UMUMIY MA'LUMOTLARI";
        ws.Cell(1, 1).Style.Font.Bold = true;
        ws.Cell(1, 1).Style.Font.FontSize = 14;
        ws.Cell(1, 1).Style.Font.FontColor = XLColor.FromHtml("#1E3A8A");

        var data = new (string Key, object Value)[]
        {
            ("Loyiha Nomi", p.Name),
            ("Loyiha Turi", p.ProjectType ?? "-"),
            ("Mijoz", p.Customer?.FullName ?? "-"),
            ("Mijoz Telefoni", p.Customer?.PhoneNumber ?? "-"),
            ("Manzil", p.Location ?? "-"),
            ("Boshlanish Sanasi", p.StartDate.ToString("dd.MM.yyyy")),
            ("Rejalashtirilgan Tugash", p.EndDate?.ToString("dd.MM.yyyy") ?? "-"),
            ("Haqiqiy Tugash", p.ActualEndDate?.ToString("dd.MM.yyyy") ?? "-"),
            ("Holati (Status)", p.Status.ToString()),
            ("Progress", p.ProgressPercent + "%"),
            ("Shartnoma Summasi", $"{p.ContractAmount:N2} {p.Currency}"),
            ("Rejalashtirilgan Byudjet", $"{p.Budget:N2} {p.Currency}"),
            ("Yaratgan Xodim", p.CreatedByUser?.FullName ?? "-"),
            ("Izoh", p.Notes ?? "-")
        };

        for (int i = 0; i < data.Length; i++)
        {
            ws.Cell(i + 3, 1).Value = data[i].Key;
            ws.Cell(i + 3, 1).Style.Font.Bold = true;
            ws.Cell(i + 3, 1).Style.Fill.BackgroundColor = XLColor.FromHtml("#F3F4F6");
            ws.Cell(i + 3, 2).Value = data[i].Value?.ToString() ?? "-";
        }

        ws.Columns().AdjustToContents();
    }

    private static void BuildPaymentsSheet(XLWorkbook wb, List<Payment> payments, string currency)
    {
        var ws = wb.Worksheets.Add("2. Mijoz To'lovlari");
        var headers = new[] { "№", "Sana", "Summa", "Valyuta", "To'lov Usuli", "Qabul Qildi", "Izoh" };
        ApplyHeaders(ws, headers, "#059669");

        int row = 2;
        int idx = 1;
        foreach (var p in payments)
        {
            ws.Cell(row, 1).Value = idx++;
            ws.Cell(row, 2).Value = p.PaymentDate.ToString("dd.MM.yyyy");
            ws.Cell(row, 3).Value = p.Amount;
            ws.Cell(row, 4).Value = currency;
            ws.Cell(row, 5).Value = p.PaymentMethod.ToString();
            ws.Cell(row, 6).Value = p.ReceivedByUser?.FullName ?? "-";
            ws.Cell(row, 7).Value = p.Notes ?? "-";
            row++;
        }

        ws.Columns().AdjustToContents();
    }

    private static void BuildExpensesSheet(XLWorkbook wb, List<Expense> expenses, string currency)
    {
        var ws = wb.Worksheets.Add("3. Xarajatlar");
        var headers = new[] { "№", "Sana", "Kategoriya", "Summa", "Valyuta", "Tavsif", "Kirituvchi", "Izoh" };
        ApplyHeaders(ws, headers, "#DC2626");

        int row = 2;
        int idx = 1;
        foreach (var e in expenses)
        {
            ws.Cell(row, 1).Value = idx++;
            ws.Cell(row, 2).Value = e.ExpenseDate.ToString("dd.MM.yyyy");
            ws.Cell(row, 3).Value = e.Category.ToString();
            ws.Cell(row, 4).Value = e.Amount;
            ws.Cell(row, 5).Value = currency;
            ws.Cell(row, 6).Value = e.Description;
            ws.Cell(row, 7).Value = e.CreatedByUser?.FullName ?? "-";
            ws.Cell(row, 8).Value = e.Notes ?? "-";
            row++;
        }

        ws.Columns().AdjustToContents();
    }

    private static void BuildMaterialsSheet(XLWorkbook wb, List<MaterialPurchase> purchases, string currency)
    {
        var ws = wb.Worksheets.Add("4. Materiallar Xaridi");
        var headers = new[] { "№", "Sana", "Material Nomi", "Miqdor", "Birlik", "Birlik Narxi", "Jami Summa", "Valyuta", "Yetkazib Beruvchi", "Chek / Hujjat №" };
        ApplyHeaders(ws, headers, "#D97706");

        int row = 2;
        int idx = 1;
        foreach (var mp in purchases)
        {
            ws.Cell(row, 1).Value = idx++;
            ws.Cell(row, 2).Value = mp.PurchaseDate.ToString("dd.MM.yyyy");
            ws.Cell(row, 3).Value = mp.Material?.Name ?? "-";
            ws.Cell(row, 4).Value = mp.Quantity;
            ws.Cell(row, 5).Value = mp.Unit;
            ws.Cell(row, 6).Value = mp.UnitPrice;
            ws.Cell(row, 7).Value = mp.TotalCost;
            ws.Cell(row, 8).Value = currency;
            ws.Cell(row, 9).Value = mp.Supplier ?? "-";
            ws.Cell(row, 10).Value = mp.ReceiptNumber ?? "-";
            row++;
        }

        ws.Columns().AdjustToContents();
    }

    private static void BuildWorkersSheet(XLWorkbook wb, List<WorkerPayment> workerPayments, string currency)
    {
        var ws = wb.Worksheets.Add("5. Usta va Ish haqlari");
        var headers = new[] { "№", "Usta / Brigada", "Mutaxassisligi", "Bajarilgan Ish", "Kelishilgan Haq", "Bajarilgan Ish Haqi", "To'langan Summa", "Qolgan Qarz", "Valyuta" };
        ApplyHeaders(ws, headers, "#7C3AED");

        int row = 2;
        int idx = 1;
        foreach (var wp in workerPayments)
        {
            var remaining = wp.WorkAmount > 0 ? (wp.WorkAmount - wp.PaidAmount) : (wp.AgreedAmount - wp.PaidAmount);

            ws.Cell(row, 1).Value = idx++;
            ws.Cell(row, 2).Value = wp.Worker?.FullName ?? "-";
            ws.Cell(row, 3).Value = wp.Worker?.Specialty ?? "-";
            ws.Cell(row, 4).Value = wp.JobDescription;
            ws.Cell(row, 5).Value = wp.AgreedAmount;
            ws.Cell(row, 6).Value = wp.WorkAmount;
            ws.Cell(row, 7).Value = wp.PaidAmount;
            ws.Cell(row, 8).Value = remaining;
            ws.Cell(row, 9).Value = currency;
            row++;
        }

        ws.Columns().AdjustToContents();
    }

    private static void BuildExtraWorksSheet(XLWorkbook wb, List<ExtraWork> extraWorks, string currency)
    {
        var ws = wb.Worksheets.Add("6. Qo'shimcha Ishlar");
        var headers = new[] { "№", "Ish Nomi", "Tavsif", "Mijoz Summasi", "Haqiqiy Tannarx", "Foyda Ta'siri", "Tasdiqlandi", "Tasdiqlangan Sana" };
        ApplyHeaders(ws, headers, "#2563EB");

        int row = 2;
        int idx = 1;
        foreach (var ew in extraWorks)
        {
            ws.Cell(row, 1).Value = idx++;
            ws.Cell(row, 2).Value = ew.Title;
            ws.Cell(row, 3).Value = ew.Description ?? "-";
            ws.Cell(row, 4).Value = ew.CustomerAmount;
            ws.Cell(row, 5).Value = ew.ActualCost;
            ws.Cell(row, 6).Value = ew.CustomerAmount - ew.ActualCost;
            ws.Cell(row, 7).Value = ew.IsApprovedByCustomer ? "Ha" : "Yo'q";
            ws.Cell(row, 8).Value = ew.ApprovedAt?.ToString("dd.MM.yyyy") ?? "-";
            row++;
        }

        ws.Columns().AdjustToContents();
    }

    private static void BuildTasksSheet(XLWorkbook wb, List<ProjectTask> tasks)
    {
        var ws = wb.Worksheets.Add("7. Vazifalar va Progress");
        var headers = new[] { "№", "Vazifa Nomi", "Bosqich", "Og'irlik", "Holati", "Muddat", "Tugallangan Sana" };
        ApplyHeaders(ws, headers, "#0D9488");

        int row = 2;
        int idx = 1;
        foreach (var t in tasks)
        {
            ws.Cell(row, 1).Value = idx++;
            ws.Cell(row, 2).Value = t.Title;
            ws.Cell(row, 3).Value = t.Stage?.Name ?? "-";
            ws.Cell(row, 4).Value = t.Weight;
            ws.Cell(row, 5).Value = t.IsCompleted ? "Bajarildi" : "Jarayonda";
            ws.Cell(row, 6).Value = t.DueDate?.ToString("dd.MM.yyyy") ?? "-";
            ws.Cell(row, 7).Value = t.CompletedAt?.ToString("dd.MM.yyyy") ?? "-";
            row++;
        }

        ws.Columns().AdjustToContents();
    }

    private static void BuildFinancialSummarySheet(XLWorkbook wb, Project p, List<Payment> payments, List<Expense> expenses)
    {
        var ws = wb.Worksheets.Add("8. Moliyaviy Xulosa");

        ws.Cell(1, 1).Value = "LOYIHA MOLIYAVIY HISOBOTI";
        ws.Cell(1, 1).Style.Font.Bold = true;
        ws.Cell(1, 1).Style.Font.FontSize = 14;

        var totalPaid = payments.Sum(x => x.Amount);
        var extraIncome = p.ExtraWorks.Where(ew => ew.IsApprovedByCustomer).Sum(ew => ew.CustomerAmount);
        var totalContract = p.ContractAmount + extraIncome;
        var remainingPayment = totalContract - totalPaid;

        var matExp = p.MaterialPurchases.Sum(mp => mp.TotalCost) + expenses.Where(e => e.Category == ExpenseCategory.Material).Sum(e => e.Amount);
        var labExp = p.WorkerPayments.Sum(wp => wp.PaidAmount) + expenses.Where(e => e.Category == ExpenseCategory.Labor).Sum(e => e.Amount);
        var othExp = expenses.Where(e => e.Category != ExpenseCategory.Material && e.Category != ExpenseCategory.Labor).Sum(e => e.Amount);
        var extraCost = p.ExtraWorks.Where(ew => ew.IsApprovedByCustomer).Sum(ew => ew.ActualCost);

        var totalExpenses = matExp + labExp + othExp + extraCost;
        var grossProfit = totalContract - totalExpenses;
        var remainingBudget = p.Budget - totalExpenses;
        var margin = totalContract > 0 ? Math.Round(grossProfit / totalContract * 100, 2) : 0;

        var items = new (string Item, decimal Value)[]
        {
            ("Asosiy Shartnoma Summasi", p.ContractAmount),
            ("Tasdiqlangan Qo'shimcha Ishlar (Daromad)", extraIncome),
            ("JAMI DAROMAD (Shartnoma + Qo'shimcha)", totalContract),
            ("Mijozdan Olingan Jami To'lov", totalPaid),
            ("Mijozdan Kutilayotgan Qoldiq (Qarzdorlik)", remainingPayment),
            ("Material Xarajatlari", matExp),
            ("Usta va Ish Haqi Xarajatlari", labExp),
            ("Boshqa Operatsion Xarajatlar", othExp),
            ("Qo'shimcha Ishlar Tannarxi", extraCost),
            ("JAMI XARAJATLAR", totalExpenses),
            ("Rejalashtirilgan Byudjet", p.Budget),
            ("Byudjetdan Qolgan Mablag'", remainingBudget),
            ("SOF/YALPI FOYDA", grossProfit),
            ("Rentabellik (Margin %)", margin)
        };

        for (int i = 0; i < items.Length; i++)
        {
            ws.Cell(i + 3, 1).Value = items[i].Item;
            ws.Cell(i + 3, 1).Style.Font.Bold = i == 2 || i == 9 || i == 12;
            ws.Cell(i + 3, 2).Value = items[i].Value;
            ws.Cell(i + 3, 2).Style.Font.Bold = i == 2 || i == 9 || i == 12;
        }

        ws.Columns().AdjustToContents();
    }

    private static void BuildAllProjectsSheet(XLWorkbook wb, List<Project> allProjects)
    {
        var ws = wb.Worksheets.Add("9. Barcha Loyihalar");
        var headers = new[] { "№", "Loyiha Nomi", "Mijoz", "Holati", "Progress", "Shartnoma", "Byudjet" };
        ApplyHeaders(ws, headers, "#374151");

        int row = 2;
        int idx = 1;
        foreach (var p in allProjects)
        {
            ws.Cell(row, 1).Value = idx++;
            ws.Cell(row, 2).Value = p.Name;
            ws.Cell(row, 3).Value = p.Customer?.FullName ?? "-";
            ws.Cell(row, 4).Value = p.Status.ToString();
            ws.Cell(row, 5).Value = p.ProgressPercent + "%";
            ws.Cell(row, 6).Value = p.ContractAmount;
            ws.Cell(row, 7).Value = p.Budget;
            row++;
        }

        ws.Columns().AdjustToContents();
    }

    private static void ApplyHeaders(IXLWorksheet ws, string[] headers, string hexColor)
    {
        for (int i = 0; i < headers.Length; i++)
        {
            ws.Cell(1, i + 1).Value = headers[i];
            ws.Cell(1, i + 1).Style.Font.Bold = true;
            ws.Cell(1, i + 1).Style.Fill.BackgroundColor = XLColor.FromHtml(hexColor);
            ws.Cell(1, i + 1).Style.Font.FontColor = XLColor.White;
        }
    }
}

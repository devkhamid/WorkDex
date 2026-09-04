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

    private async Task<List<Guid>> GetAccessibleProjectIdsAsync(Guid requestingUserId, UserRole requestingUserRole)
    {
        if (requestingUserRole == UserRole.SuperAdmin)
            return await _context.Projects.Select(p => p.Id).ToListAsync();

        if (requestingUserRole == UserRole.Admin)
            return await _context.Projects
                .Where(p => p.CreatedByUserId == requestingUserId ||
                            p.CompanyAdminId == requestingUserId ||
                            (p.CreatedByUser != null && p.CreatedByUser.CompanyAdminId == requestingUserId))
                .Select(p => p.Id)
                .ToListAsync();

        var user = await _context.Users.FindAsync(requestingUserId);
        var targetCompanyAdminId = user?.CompanyAdminId ?? requestingUserId;
        return await _context.Projects
            .Where(p => p.CreatedByUserId == requestingUserId ||
                        p.CompanyAdminId == targetCompanyAdminId ||
                        p.Members.Any(m => m.UserId == requestingUserId))
            .Select(p => p.Id)
            .ToListAsync();
    }

    public async Task<byte[]> ExportProjectToExcelAsync(Guid projectId, Guid requestingUserId, UserRole requestingUserRole)
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

        // 1. Loyiha haqida
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

        // 9. Barcha loyihalar konsolidatsiyasi (faqat kompaniya loyihalari)
        var accessibleIds = await GetAccessibleProjectIdsAsync(requestingUserId, requestingUserRole);
        var allProjects = await _context.Projects
            .Include(p => p.Customer)
            .Where(p => accessibleIds.Contains(p.Id))
            .ToListAsync();
        BuildAllProjectsSheet(workbook, allProjects);

        using var stream = new MemoryStream();
        workbook.SaveAs(stream);
        return stream.ToArray();
    }

    public async Task<byte[]> ExportAllProjectsToExcelAsync(Guid requestingUserId, UserRole requestingUserRole)
    {
        var accessibleIds = await GetAccessibleProjectIdsAsync(requestingUserId, requestingUserRole);

        var allProjects = await _context.Projects
            .Include(p => p.Customer)
            .Include(p => p.CreatedByUser)
            .Where(p => accessibleIds.Contains(p.Id))
            .OrderByDescending(p => p.CreatedAt)
            .ToListAsync();

        var allPayments = await _context.Payments.Where(p => accessibleIds.Contains(p.ProjectId)).ToListAsync();
        var allExpenses = await _context.Expenses.Where(e => e.ProjectId != null && accessibleIds.Contains(e.ProjectId.Value)).ToListAsync();
        var allPurchases = await _context.MaterialPurchases.Where(mp => accessibleIds.Contains(mp.ProjectId)).ToListAsync();
        var allWorkerPayments = await _context.WorkerPayments.Where(wp => accessibleIds.Contains(wp.ProjectId)).ToListAsync();
        var allExtraWorks = await _context.ExtraWorks.Where(ew => accessibleIds.Contains(ew.ProjectId)).ToListAsync();

        using var workbook = new XLWorkbook();
        var ws = workbook.Worksheets.Add("Barcha Loyihalar");
        ws.ShowGridLines = true;

        // Title banner
        ws.Cell(1, 1).Value = "WORKDEX — BARCHA LOYIHALAR KONSOLIDATSIYALANGAN HISOBOTI";
        ws.Range(1, 1, 1, 15).Merge();
        ws.Row(1).Height = 28;
        var banner = ws.Range(1, 1, 1, 15);
        banner.Style.Font.Bold = true;
        banner.Style.Font.FontSize = 12;
        banner.Style.Font.FontColor = XLColor.White;
        banner.Style.Fill.BackgroundColor = XLColor.FromHtml("#1E293B");
        banner.Style.Alignment.Vertical = XLAlignmentVerticalValues.Center;
        banner.Style.Alignment.Horizontal = XLAlignmentHorizontalValues.Center;

        // Headers
        var headers = new[]
        {
            "№", "Loyiha Nomi", "Loyiha Turi", "Mijoz", "Holati", "Progress",
            "Shartnoma Summasi", "Byudjet", "Valyuta", "Olingan Tushum", "Qoldiq Tushum",
            "Jami Xarajatlar", "Kutilayotgan Foyda", "Boshlanish Sanasi", "Tugash Sanasi"
        };

        for (int i = 0; i < headers.Length; i++)
        {
            var cell = ws.Cell(3, i + 1);
            cell.Value = headers[i];
            cell.Style.Font.Bold = true;
            cell.Style.Fill.BackgroundColor = XLColor.FromHtml("#0284C7");
            cell.Style.Font.FontColor = XLColor.White;
            cell.Style.Alignment.Vertical = XLAlignmentVerticalValues.Center;
            cell.Style.Alignment.Horizontal = XLAlignmentHorizontalValues.Center;
        }
        ws.Row(3).Height = 24;

        int row = 4;
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

            // Format numbers
            ws.Cell(row, 7).Style.NumberFormat.Format = "#,##0.00";
            ws.Cell(row, 8).Style.NumberFormat.Format = "#,##0.00";
            ws.Cell(row, 10).Style.NumberFormat.Format = "#,##0.00";
            ws.Cell(row, 11).Style.NumberFormat.Format = "#,##0.00";
            ws.Cell(row, 12).Style.NumberFormat.Format = "#,##0.00";
            ws.Cell(row, 13).Style.NumberFormat.Format = "#,##0.00";

            // Zebra styling
            if (row % 2 == 0)
            {
                ws.Range(row, 1, row, 15).Style.Fill.BackgroundColor = XLColor.FromHtml("#F8FAFC");
            }

            row++;
        }

        // Apply borders
        if (row > 4)
        {
            var tableRange = ws.Range(3, 1, row - 1, 15);
            tableRange.Style.Border.SetOutsideBorder(XLBorderStyleValues.Thin);
            tableRange.Style.Border.SetOutsideBorderColor(XLColor.FromHtml("#CBD5E1"));
            tableRange.Style.Border.SetInsideBorder(XLBorderStyleValues.Thin);
            tableRange.Style.Border.SetInsideBorderColor(XLColor.FromHtml("#E2E8F0"));
        }

        ws.Columns().AdjustToContents();

        using var stream = new MemoryStream();
        workbook.SaveAs(stream);
        return stream.ToArray();
    }

    private static void BuildOverviewSheet(XLWorkbook wb, Project p)
    {
        var ws = wb.Worksheets.Add("1. Loyiha haqida");
        ws.ShowGridLines = true;

        // Title Header
        ws.Cell(1, 1).Value = "WORKDEX — LOYIHA PASPORTI VA ASOSIY KO'RSATKICHLARI";
        ws.Range(1, 1, 1, 2).Merge();
        ws.Row(1).Height = 30;
        var header = ws.Range(1, 1, 1, 2);
        header.Style.Font.Bold = true;
        header.Style.Font.FontSize = 12;
        header.Style.Font.FontColor = XLColor.White;
        header.Style.Fill.BackgroundColor = XLColor.FromHtml("#1E293B"); // Slate Dark
        header.Style.Alignment.Vertical = XLAlignmentVerticalValues.Center;
        header.Style.Alignment.Horizontal = XLAlignmentHorizontalValues.Center;

        var data = new (string Key, object Value)[]
        {
            ("Loyiha Nomi", p.Name),
            ("Loyiha Turi", p.ProjectType ?? "-"),
            ("Mijoz (Buyurtmachi)", p.Customer?.FullName ?? "-"),
            ("Mijoz Telefoni", p.Customer?.PhoneNumber ?? "-"),
            ("Joylashuv / Manzil", p.Location ?? "-"),
            ("Boshlanish Sanasi", p.StartDate.ToString("dd.MM.yyyy")),
            ("Rejalashtirilgan Tugash Sanasi", p.EndDate?.ToString("dd.MM.yyyy") ?? "-"),
            ("Haqiqiy Tugash Sanasi", p.ActualEndDate?.ToString("dd.MM.yyyy") ?? "-"),
            ("Loyiha Holati (Status)", p.Status.ToString()),
            ("Bajarilish Darajasi (Progress)", p.ProgressPercent + "%"),
            ("Shartnoma Summasi", $"{p.ContractAmount:N2} {p.Currency}"),
            ("Rejalashtirilgan Byudjet", $"{p.Budget:N2} {p.Currency}"),
            ("Yaratgan Xodim / Mas'ul", p.CreatedByUser?.FullName ?? "-"),
            ("Qo'shimcha Izoh", p.Notes ?? "-")
        };

        for (int i = 0; i < data.Length; i++)
        {
            int r = i + 3;
            ws.Row(r).Height = 22;

            // Column A: Key
            var cellKey = ws.Cell(r, 1);
            cellKey.Value = data[i].Key;
            cellKey.Style.Font.Bold = true;
            cellKey.Style.Font.FontSize = 10;
            cellKey.Style.Fill.BackgroundColor = XLColor.FromHtml("#F1F5F9"); // Soft slate
            cellKey.Style.Font.FontColor = XLColor.FromHtml("#1E293B");
            cellKey.Style.Alignment.Vertical = XLAlignmentVerticalValues.Center;

            // Column B: Value
            var cellVal = ws.Cell(r, 2);
            cellVal.Value = data[i].Value?.ToString() ?? "-";
            cellVal.Style.Font.FontSize = 10;
            cellVal.Style.Font.FontColor = XLColor.FromHtml("#0F172A");
            cellVal.Style.Alignment.Vertical = XLAlignmentVerticalValues.Center;

            if (data[i].Key.Contains("Summasi") || data[i].Key.Contains("Byudjet"))
            {
                cellVal.Style.Font.Bold = true;
                cellVal.Style.Font.FontColor = XLColor.FromHtml("#0F766E");
            }
        }

        // Apply grid borders to table
        var tableRange = ws.Range(3, 1, data.Length + 2, 2);
        tableRange.Style.Border.SetOutsideBorder(XLBorderStyleValues.Medium);
        tableRange.Style.Border.SetOutsideBorderColor(XLColor.FromHtml("#94A3B8"));
        tableRange.Style.Border.SetInsideBorder(XLBorderStyleValues.Thin);
        tableRange.Style.Border.SetInsideBorderColor(XLColor.FromHtml("#CBD5E1"));

        ws.Columns().AdjustToContents();
        ws.Column(1).Width = Math.Max(ws.Column(1).Width, 30);
        ws.Column(2).Width = Math.Max(ws.Column(2).Width, 50);
    }

    private static void BuildPaymentsSheet(XLWorkbook wb, List<Payment> payments, string currency)
    {
        var ws = wb.Worksheets.Add("2. Mijoz To'lovlari");
        ws.ShowGridLines = true;
        var headers = new[] { "№", "Sana", "Summa", "Valyuta", "To'lov Usuli", "Qabul Qildi", "Izoh" };
        ApplyHeaders(ws, headers, "#059669");

        int row = 2;
        int idx = 1;
        foreach (var p in payments)
        {
            ws.Row(row).Height = 20;
            ws.Cell(row, 1).Value = idx++;
            ws.Cell(row, 2).Value = p.PaymentDate.ToString("dd.MM.yyyy");
            ws.Cell(row, 3).Value = p.Amount;
            ws.Cell(row, 3).Style.NumberFormat.Format = "#,##0.00";
            ws.Cell(row, 4).Value = currency;
            ws.Cell(row, 5).Value = p.PaymentMethod.ToString();
            ws.Cell(row, 6).Value = p.ReceivedByUser?.FullName ?? "-";
            ws.Cell(row, 7).Value = p.Notes ?? "-";

            if (row % 2 == 0)
                ws.Range(row, 1, row, headers.Length).Style.Fill.BackgroundColor = XLColor.FromHtml("#F8FAFC");

            row++;
        }

        // Total
        if (payments.Count > 0)
        {
            ws.Row(row).Height = 22;
            ws.Cell(row, 2).Value = "JAMI:";
            ws.Cell(row, 2).Style.Font.Bold = true;
            ws.Cell(row, 3).FormulaA1 = $"SUM(C2:C{row - 1})";
            ws.Cell(row, 3).Style.Font.Bold = true;
            ws.Cell(row, 3).Style.NumberFormat.Format = "#,##0.00";
            ws.Cell(row, 4).Value = currency;
            ws.Cell(row, 4).Style.Font.Bold = true;
            ws.Range(row, 1, row, headers.Length).Style.Fill.BackgroundColor = XLColor.FromHtml("#ECFDF5");
            row++;
        }

        ApplyTableBorders(ws, 1, row - 1, headers.Length);
        ws.Columns().AdjustToContents();
    }

    private static void BuildExpensesSheet(XLWorkbook wb, List<Expense> expenses, string currency)
    {
        var ws = wb.Worksheets.Add("3. Xarajatlar");
        ws.ShowGridLines = true;
        var headers = new[] { "№", "Sana", "Kategoriya", "Summa", "Valyuta", "Tavsif", "Kirituvchi", "Izoh" };
        ApplyHeaders(ws, headers, "#DC2626");

        int row = 2;
        int idx = 1;
        foreach (var e in expenses)
        {
            ws.Row(row).Height = 20;
            ws.Cell(row, 1).Value = idx++;
            ws.Cell(row, 2).Value = e.ExpenseDate.ToString("dd.MM.yyyy");
            ws.Cell(row, 3).Value = e.Category.ToString();
            ws.Cell(row, 4).Value = e.Amount;
            ws.Cell(row, 4).Style.NumberFormat.Format = "#,##0.00";
            ws.Cell(row, 5).Value = currency;
            ws.Cell(row, 6).Value = e.Description;
            ws.Cell(row, 7).Value = e.CreatedByUser?.FullName ?? "-";
            ws.Cell(row, 8).Value = e.Notes ?? "-";

            if (row % 2 == 0)
                ws.Range(row, 1, row, headers.Length).Style.Fill.BackgroundColor = XLColor.FromHtml("#F8FAFC");

            row++;
        }

        // Total
        if (expenses.Count > 0)
        {
            ws.Row(row).Height = 22;
            ws.Cell(row, 3).Value = "JAMI:";
            ws.Cell(row, 3).Style.Font.Bold = true;
            ws.Cell(row, 4).FormulaA1 = $"SUM(D2:D{row - 1})";
            ws.Cell(row, 4).Style.Font.Bold = true;
            ws.Cell(row, 4).Style.NumberFormat.Format = "#,##0.00";
            ws.Cell(row, 5).Value = currency;
            ws.Cell(row, 5).Style.Font.Bold = true;
            ws.Range(row, 1, row, headers.Length).Style.Fill.BackgroundColor = XLColor.FromHtml("#FEF2F2");
            row++;
        }

        ApplyTableBorders(ws, 1, row - 1, headers.Length);
        ws.Columns().AdjustToContents();
    }

    private static void BuildMaterialsSheet(XLWorkbook wb, List<MaterialPurchase> purchases, string currency)
    {
        var ws = wb.Worksheets.Add("4. Materiallar Xaridi");
        ws.ShowGridLines = true;
        var headers = new[] { "№", "Sana", "Material Nomi", "Miqdor", "Birlik", "Birlik Narxi", "Jami Summa", "Valyuta", "Yetkazib Beruvchi", "Chek №" };
        ApplyHeaders(ws, headers, "#D97706");

        int row = 2;
        int idx = 1;
        foreach (var mp in purchases)
        {
            ws.Row(row).Height = 20;
            ws.Cell(row, 1).Value = idx++;
            ws.Cell(row, 2).Value = mp.PurchaseDate.ToString("dd.MM.yyyy");
            ws.Cell(row, 3).Value = mp.Material?.Name ?? "-";
            ws.Cell(row, 4).Value = mp.Quantity;
            ws.Cell(row, 5).Value = mp.Unit;
            ws.Cell(row, 6).Value = mp.UnitPrice;
            ws.Cell(row, 6).Style.NumberFormat.Format = "#,##0.00";
            ws.Cell(row, 7).Value = mp.TotalCost;
            ws.Cell(row, 7).Style.NumberFormat.Format = "#,##0.00";
            ws.Cell(row, 8).Value = currency;
            ws.Cell(row, 9).Value = mp.Supplier ?? "-";
            ws.Cell(row, 10).Value = mp.ReceiptNumber ?? "-";

            if (row % 2 == 0)
                ws.Range(row, 1, row, headers.Length).Style.Fill.BackgroundColor = XLColor.FromHtml("#F8FAFC");

            row++;
        }

        if (purchases.Count > 0)
        {
            ws.Row(row).Height = 22;
            ws.Cell(row, 6).Value = "JAMI:";
            ws.Cell(row, 6).Style.Font.Bold = true;
            ws.Cell(row, 7).FormulaA1 = $"SUM(G2:G{row - 1})";
            ws.Cell(row, 7).Style.Font.Bold = true;
            ws.Cell(row, 7).Style.NumberFormat.Format = "#,##0.00";
            ws.Cell(row, 8).Value = currency;
            ws.Cell(row, 8).Style.Font.Bold = true;
            ws.Range(row, 1, row, headers.Length).Style.Fill.BackgroundColor = XLColor.FromHtml("#FFFBEB");
            row++;
        }

        ApplyTableBorders(ws, 1, row - 1, headers.Length);
        ws.Columns().AdjustToContents();
    }

    private static void BuildWorkersSheet(XLWorkbook wb, List<WorkerPayment> workerPayments, string currency)
    {
        var ws = wb.Worksheets.Add("5. Usta va Ish Haqi");
        ws.ShowGridLines = true;
        var headers = new[] { "№", "Usta Ismi", "Mutaxassislik", "Ish Tavsifi", "Kelishilgan Haq", "Ishlangan Haq", "To'langan Summa", "Qoldiq Qarz", "Valyuta" };
        ApplyHeaders(ws, headers, "#7C3AED");

        int row = 2;
        int idx = 1;
        foreach (var wp in workerPayments)
        {
            // PDF §15: "Qolgan usta haqi = Kelishilgan summa − To'langan summa".
            // API'dagi WorkerPaymentDto.RemainingAmount bilan bir xil formula —
            // Excel va API bir xil raqamni ko'rsatishi shart.
            var remaining = wp.AgreedAmount - wp.PaidAmount;
            ws.Row(row).Height = 20;
            ws.Cell(row, 1).Value = idx++;
            ws.Cell(row, 2).Value = wp.Worker?.FullName ?? "-";
            ws.Cell(row, 3).Value = wp.Worker?.Specialty ?? "-";
            ws.Cell(row, 4).Value = wp.JobDescription;
            ws.Cell(row, 5).Value = wp.AgreedAmount;
            ws.Cell(row, 5).Style.NumberFormat.Format = "#,##0.00";
            ws.Cell(row, 6).Value = wp.WorkAmount;
            ws.Cell(row, 6).Style.NumberFormat.Format = "#,##0.00";
            ws.Cell(row, 7).Value = wp.PaidAmount;
            ws.Cell(row, 7).Style.NumberFormat.Format = "#,##0.00";
            ws.Cell(row, 8).Value = remaining;
            ws.Cell(row, 8).Style.NumberFormat.Format = "#,##0.00";
            ws.Cell(row, 9).Value = currency;

            if (row % 2 == 0)
                ws.Range(row, 1, row, headers.Length).Style.Fill.BackgroundColor = XLColor.FromHtml("#F8FAFC");

            row++;
        }

        if (workerPayments.Count > 0)
        {
            ws.Row(row).Height = 22;
            ws.Cell(row, 4).Value = "JAMI:";
            ws.Cell(row, 4).Style.Font.Bold = true;
            ws.Cell(row, 5).FormulaA1 = $"SUM(E2:E{row - 1})";
            ws.Cell(row, 6).FormulaA1 = $"SUM(F2:F{row - 1})";
            ws.Cell(row, 7).FormulaA1 = $"SUM(G2:G{row - 1})";
            ws.Cell(row, 8).FormulaA1 = $"SUM(H2:H{row - 1})";
            ws.Range(row, 5, row, 8).Style.Font.Bold = true;
            ws.Range(row, 5, row, 8).Style.NumberFormat.Format = "#,##0.00";
            ws.Range(row, 1, row, headers.Length).Style.Fill.BackgroundColor = XLColor.FromHtml("#F5F3FF");
            row++;
        }

        ApplyTableBorders(ws, 1, row - 1, headers.Length);
        ws.Columns().AdjustToContents();
    }

    private static void BuildExtraWorksSheet(XLWorkbook wb, List<ExtraWork> extraWorks, string currency)
    {
        var ws = wb.Worksheets.Add("6. Qo'shimcha Ishlar");
        ws.ShowGridLines = true;
        var headers = new[] { "№", "Ish Nomi", "Tavsif", "Mijoz Summasi", "Tannarx", "Foyda", "Valyuta", "Tasdiqlanganmi", "Tasdiqlangan Sana" };
        ApplyHeaders(ws, headers, "#0D9488");

        int row = 2;
        int idx = 1;
        foreach (var ew in extraWorks)
        {
            var profit = ew.CustomerAmount - ew.ActualCost;
            ws.Row(row).Height = 20;
            ws.Cell(row, 1).Value = idx++;
            ws.Cell(row, 2).Value = ew.Title;
            ws.Cell(row, 3).Value = ew.Description ?? "-";
            ws.Cell(row, 4).Value = ew.CustomerAmount;
            ws.Cell(row, 4).Style.NumberFormat.Format = "#,##0.00";
            ws.Cell(row, 5).Value = ew.ActualCost;
            ws.Cell(row, 5).Style.NumberFormat.Format = "#,##0.00";
            ws.Cell(row, 6).Value = profit;
            ws.Cell(row, 6).Style.NumberFormat.Format = "#,##0.00";
            ws.Cell(row, 7).Value = currency;
            ws.Cell(row, 8).Value = ew.IsApprovedByCustomer ? "Ha" : "Yo'q";
            ws.Cell(row, 9).Value = ew.ApprovedAt?.ToString("dd.MM.yyyy") ?? "-";

            if (row % 2 == 0)
                ws.Range(row, 1, row, headers.Length).Style.Fill.BackgroundColor = XLColor.FromHtml("#F8FAFC");

            row++;
        }

        ApplyTableBorders(ws, 1, row - 1, headers.Length);
        ws.Columns().AdjustToContents();
    }

    private static void BuildTasksSheet(XLWorkbook wb, List<ProjectTask> tasks)
    {
        var ws = wb.Worksheets.Add("7. Vazifalar");
        ws.ShowGridLines = true;
        var headers = new[] { "№", "Vazifa Nomi", "Bosqich", "Og'irlik (Ball)", "Holati", "Bajarilgan Sana", "Muddat" };
        ApplyHeaders(ws, headers, "#EA580C");

        int row = 2;
        int idx = 1;
        foreach (var t in tasks)
        {
            ws.Row(row).Height = 20;
            ws.Cell(row, 1).Value = idx++;
            ws.Cell(row, 2).Value = t.Title;
            ws.Cell(row, 3).Value = t.Stage?.Name ?? "Umumiy";
            ws.Cell(row, 4).Value = t.Weight;
            ws.Cell(row, 5).Value = t.IsCompleted ? "Bajarildi" : "Kutilmoqda";
            ws.Cell(row, 6).Value = t.CompletedAt?.ToString("dd.MM.yyyy") ?? "-";
            ws.Cell(row, 7).Value = t.DueDate?.ToString("dd.MM.yyyy") ?? "-";

            if (t.IsCompleted)
            {
                ws.Cell(row, 5).Style.Font.FontColor = XLColor.FromHtml("#16A34A");
                ws.Cell(row, 5).Style.Font.Bold = true;
            }

            if (row % 2 == 0)
                ws.Range(row, 1, row, headers.Length).Style.Fill.BackgroundColor = XLColor.FromHtml("#F8FAFC");

            row++;
        }

        ApplyTableBorders(ws, 1, row - 1, headers.Length);
        ws.Columns().AdjustToContents();
    }

    private static void BuildFinancialSummarySheet(XLWorkbook wb, Project p, List<Payment> payments, List<Expense> expenses)
    {
        var ws = wb.Worksheets.Add("8. Moliyaviy Xulosa");
        ws.ShowGridLines = true;

        ws.Cell(1, 1).Value = "WORKDEX — LOYIHA TO'LIQ MOLIYAVIY XULOSASI";
        ws.Range(1, 1, 1, 3).Merge();
        ws.Row(1).Height = 30;
        var head = ws.Range(1, 1, 1, 3);
        head.Style.Font.Bold = true;
        head.Style.Font.FontSize = 12;
        head.Style.Font.FontColor = XLColor.White;
        head.Style.Fill.BackgroundColor = XLColor.FromHtml("#1E293B");
        head.Style.Alignment.Vertical = XLAlignmentVerticalValues.Center;
        head.Style.Alignment.Horizontal = XLAlignmentHorizontalValues.Center;

        var totalPaid = payments.Sum(x => x.Amount);
        var extraIncome = p.ExtraWorks.Where(x => x.IsApprovedByCustomer).Sum(x => x.CustomerAmount);
        var totalContract = p.ContractAmount + extraIncome;
        var remainingPayment = totalContract - totalPaid;

        var matPurchases = p.MaterialPurchases.Sum(x => x.TotalCost);
        var matExpenses = expenses.Where(x => x.Category == ExpenseCategory.Material).Sum(x => x.Amount);
        var totalMaterial = matPurchases + matExpenses;

        var workerPaid = p.WorkerPayments.Sum(x => x.PaidAmount);
        var laborExpenses = expenses.Where(x => x.Category == ExpenseCategory.Labor).Sum(x => x.Amount);
        var totalLabor = workerPaid + laborExpenses;

        var otherExpenses = expenses.Where(x => x.Category != ExpenseCategory.Material && x.Category != ExpenseCategory.Labor).Sum(x => x.Amount);
        var extraCosts = p.ExtraWorks.Where(x => x.IsApprovedByCustomer).Sum(x => x.ActualCost);
        var totalCost = totalMaterial + totalLabor + otherExpenses + extraCosts;
        var netProfit = totalContract - totalCost;

        var summaryItems = new (string Name, decimal Amount, string Cat)[]
        {
            ("1. Asosiy Shartnoma Summasi", p.ContractAmount, "KIRIM"),
            ("2. Qo'shimcha Ishlar Tushumi", extraIncome, "KIRIM"),
            ("3. JAMI SHARTNOMA DAROMADI", totalContract, "KIRIM_TOTAL"),
            ("4. Olingan Tushum (Mijoz to'lagan)", totalPaid, "KIRIM"),
            ("5. Qoldiq Tushum (Mijoz qarzi)", remainingPayment, "KIRIM"),
            ("6. Material Xarajatlari", totalMaterial, "CHIQIM"),
            ("7. Ish Haqi va Usta Xarajatlari", totalLabor, "CHIQIM"),
            ("8. Transport, Yoqilg'i va Boshqa Xarajatlar", otherExpenses, "CHIQIM"),
            ("9. Qo'shimcha Ishlar Tannarxi", extraCosts, "CHIQIM"),
            ("10. JAMI CHIQIM (XARAJATLAR)", totalCost, "CHIQIM_TOTAL"),
            ("11. KUTILAYOTGAN SOF FOYDA", netProfit, "PROFIT")
        };

        // Table Header
        ws.Row(3).Height = 24;
        ws.Cell(3, 1).Value = "Moliyaviy Ko'rsatkich";
        ws.Cell(3, 2).Value = "Summa";
        ws.Cell(3, 3).Value = "Valyuta";
        var th = ws.Range(3, 1, 3, 3);
        th.Style.Font.Bold = true;
        th.Style.Fill.BackgroundColor = XLColor.FromHtml("#334155");
        th.Style.Font.FontColor = XLColor.White;

        int row = 4;
        foreach (var item in summaryItems)
        {
            ws.Row(row).Height = 22;
            ws.Cell(row, 1).Value = item.Name;
            ws.Cell(row, 2).Value = item.Amount;
            ws.Cell(row, 2).Style.NumberFormat.Format = "#,##0.00";
            ws.Cell(row, 3).Value = p.Currency;

            if (item.Cat == "KIRIM_TOTAL")
            {
                ws.Range(row, 1, row, 3).Style.Font.Bold = true;
                ws.Range(row, 1, row, 3).Style.Fill.BackgroundColor = XLColor.FromHtml("#E0F2FE");
            }
            else if (item.Cat == "CHIQIM_TOTAL")
            {
                ws.Range(row, 1, row, 3).Style.Font.Bold = true;
                ws.Range(row, 1, row, 3).Style.Fill.BackgroundColor = XLColor.FromHtml("#FEE2E2");
            }
            else if (item.Cat == "PROFIT")
            {
                ws.Range(row, 1, row, 3).Style.Font.Bold = true;
                ws.Range(row, 1, row, 3).Style.Font.FontSize = 11;
                ws.Range(row, 1, row, 3).Style.Fill.BackgroundColor = XLColor.FromHtml("#DCFCE7");
                ws.Cell(row, 2).Style.Font.FontColor = XLColor.FromHtml("#15803D");
            }
            else if (row % 2 == 0)
            {
                ws.Range(row, 1, row, 3).Style.Fill.BackgroundColor = XLColor.FromHtml("#F8FAFC");
            }

            row++;
        }

        ApplyTableBorders(ws, 3, row - 1, 3);
        ws.Columns().AdjustToContents();
    }

    private static void BuildAllProjectsSheet(XLWorkbook wb, List<Project> projects)
    {
        var ws = wb.Worksheets.Add("9. Barcha Loyihalar Ro'yxati");
        ws.ShowGridLines = true;
        var headers = new[] { "№", "Loyiha Nomi", "Mijoz", "Shartnoma", "Byudjet", "Valyuta", "Status", "Progress", "Boshlanish" };
        ApplyHeaders(ws, headers, "#475569");

        int row = 2;
        int idx = 1;
        foreach (var p in projects)
        {
            ws.Row(row).Height = 20;
            ws.Cell(row, 1).Value = idx++;
            ws.Cell(row, 2).Value = p.Name;
            ws.Cell(row, 3).Value = p.Customer?.FullName ?? "-";
            ws.Cell(row, 4).Value = p.ContractAmount;
            ws.Cell(row, 4).Style.NumberFormat.Format = "#,##0.00";
            ws.Cell(row, 5).Value = p.Budget;
            ws.Cell(row, 5).Style.NumberFormat.Format = "#,##0.00";
            ws.Cell(row, 6).Value = p.Currency;
            ws.Cell(row, 7).Value = p.Status.ToString();
            ws.Cell(row, 8).Value = p.ProgressPercent + "%";
            ws.Cell(row, 9).Value = p.StartDate.ToString("dd.MM.yyyy");

            if (row % 2 == 0)
                ws.Range(row, 1, row, headers.Length).Style.Fill.BackgroundColor = XLColor.FromHtml("#F8FAFC");

            row++;
        }

        ApplyTableBorders(ws, 1, row - 1, headers.Length);
        ws.Columns().AdjustToContents();
    }

    private static void ApplyHeaders(IXLWorksheet ws, string[] headers, string hexColor)
    {
        ws.Row(1).Height = 26;
        for (int i = 0; i < headers.Length; i++)
        {
            var cell = ws.Cell(1, i + 1);
            cell.Value = headers[i];
            cell.Style.Font.Bold = true;
            cell.Style.Font.FontSize = 10;
            cell.Style.Fill.BackgroundColor = XLColor.FromHtml(hexColor);
            cell.Style.Font.FontColor = XLColor.White;
            cell.Style.Alignment.Vertical = XLAlignmentVerticalValues.Center;
            cell.Style.Alignment.Horizontal = XLAlignmentHorizontalValues.Center;
        }
    }

    private static void ApplyTableBorders(IXLWorksheet ws, int startRow, int endRow, int colCount)
    {
        if (endRow >= startRow)
        {
            var range = ws.Range(startRow, 1, endRow, colCount);
            range.Style.Border.SetOutsideBorder(XLBorderStyleValues.Medium);
            range.Style.Border.SetOutsideBorderColor(XLColor.FromHtml("#94A3B8"));
            range.Style.Border.SetInsideBorder(XLBorderStyleValues.Thin);
            range.Style.Border.SetInsideBorderColor(XLColor.FromHtml("#CBD5E1"));
        }
    }
}

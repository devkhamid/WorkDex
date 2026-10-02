using ClosedXML.Excel;
using Microsoft.EntityFrameworkCore;
using WorkDex.Api.Models;

namespace WorkDex.Api.Services;

// Yillik hisobot: "D_" varaqlarida xom ma'lumot, qolgan barcha tahlil varaqlari
// shu ma'lumotdan Excel formulalari (SUMIFS, COUNTIF...) orqali hisoblanadi.
public partial class ExcelExportService
{
    private const string ShPay = "D_Tushumlar";
    private const string ShExp = "D_Xarajatlar";
    private const string ShMat = "D_Materiallar";
    private const string ShWrk = "D_Ustalar";
    private const string ShExt = "D_QoshimchaIshlar";
    private const string ShPrj = "D_Loyihalar";

    // Xulosa varag'idagi foydalanuvchi o'zgartira oladigan kataklar.
    private const string YearRef = "'Xulosa'!$C$4";
    private const string RateRef = "'Xulosa'!$C$5";

    private const string UsdFormat = "#,##0.00;[Red]-#,##0.00";
    private const string UzsFormat = "#,##0;[Red]-#,##0";
    private const string PctFormat = "0.0%;[Red]-0.0%";

    private static readonly string[] MonthNames =
    {
        "Yanvar", "Fevral", "Mart", "Aprel", "May", "Iyun",
        "Iyul", "Avgust", "Sentabr", "Oktabr", "Noyabr", "Dekabr"
    };

    private static readonly Dictionary<ExpenseCategory, string> CategoryLabels = new()
    {
        [ExpenseCategory.Labor] = "Ish haqi (mehnat)",
        [ExpenseCategory.Material] = "Material",
        [ExpenseCategory.Transport] = "Transport",
        [ExpenseCategory.Fuel] = "Yoqilg'i",
        [ExpenseCategory.Subcontractor] = "Subpudrat",
        [ExpenseCategory.Extra] = "Qo'shimcha",
        [ExpenseCategory.Other] = "Boshqa",
        [ExpenseCategory.Cleaning] = "Tozalash",
        [ExpenseCategory.Carrying] = "Yuk tashish",
        [ExpenseCategory.AdditionalWork] = "Qo'shimcha ish",
        [ExpenseCategory.Electricity] = "Elektr energiya",
        [ExpenseCategory.Internet] = "Internet",
        [ExpenseCategory.Rent] = "Ijara",
        [ExpenseCategory.OfficeSupplies] = "Ofis jihozlari",
        [ExpenseCategory.Water] = "Suv",
        [ExpenseCategory.Gas] = "Gaz",
        [ExpenseCategory.Communal] = "Kommunal",
    };

    private static readonly Dictionary<PaymentMethod, string> PaymentMethodLabels = new()
    {
        [PaymentMethod.Cash] = "Naqd",
        [PaymentMethod.BankTransfer] = "Bank o'tkazmasi",
        [PaymentMethod.Card] = "Karta",
        [PaymentMethod.Other] = "Boshqa",
    };

    private static string CategoryLabel(ExpenseCategory c) =>
        CategoryLabels.TryGetValue(c, out var l) ? l : c.ToString();

    private static string StatusLabel(ProjectStatus s) => s switch
    {
        ProjectStatus.Planning => "Rejalashtirish",
        ProjectStatus.InProgress => "Faol",
        ProjectStatus.OnHold => "Kechikkan",
        ProjectStatus.Completed => "Yakunlangan",
        ProjectStatus.Cancelled => "Bekor qilingan",
        _ => s.ToString()
    };

    private static string ExpenseGroup(ExpenseCategory c) => c switch
    {
        ExpenseCategory.Material => "Material",
        ExpenseCategory.Labor => "Ish haqi",
        _ => "Boshqa"
    };

    private static string Q(string text) => "\"" + text.Replace("\"", "\"\"") + "\"";

    // SUMIFS('Varaq'!K:K,'Varaq'!B:B,kriteriy,...)
    private static string Sifs(string sheet, string sumCol, params (string Col, string Crit)[] criteria) =>
        $"SUMIFS('{sheet}'!{sumCol}:{sumCol}," +
        string.Join(",", criteria.Select(c => $"'{sheet}'!{c.Col}:{c.Col},{c.Crit}")) + ")";

    private static string SifsP(string sheet, string sumCol, (string Col, string Crit)[] period, params (string Col, string Crit)[] extra) =>
        Sifs(sheet, sumCol, period.Concat(extra).ToArray());

    // Locale'dan qat'i nazar "dd.mm.yyyy" ko'rinishidagi matn.
    private static string DateText(string cell) =>
        $"TEXT(DAY({cell}),\"00\")&\".\"&TEXT(MONTH({cell}),\"00\")&\".\"&YEAR({cell})";

    // Davr oralig'i hisobotida Xulosa varag'idagi o'zgartiriladigan kataklar.
    private const string StartRef = "'Xulosa'!$C$4";
    private const string EndRef = "'Xulosa'!$C$5";
    private const string RangeRateRef = "'Xulosa'!$C$6";

    // Label: Excel formulasi qismi (matn), Criteria: shu oy/ustun katagiga havola bo'yicha SUMIFS shartlari.
    private sealed record MonthSlot(string Label, bool IsFormula, Func<string, (string Col, string Crit)[]> Criteria);

    // Yillik yoki ixtiyoriy sana oralig'i — tahlil varaqlari shu obyekt orqali filtrlanadi.
    private sealed record ReportPeriod(
        bool IsRange,
        int Year,
        DateTime From,
        DateTime To,
        string RateRef,
        (string Col, string Crit)[] Cur,
        (string Col, string Crit)[] Prev,
        string Label,
        string Note,
        string Word,
        IReadOnlyList<MonthSlot> Months);

    private static ReportPeriod AnnualPeriod(int year) => new(
        false, year, default, default, RateRef,
        new[] { ("B", YearRef) },
        new[] { ("B", YearRef + "-1") },
        $"{YearRef}&\" YIL\"",
        $"\"yil ustuni: \"&{YearRef}",
        "Yil",
        Enumerable.Range(1, 12)
            .Select(m => new MonthSlot(MonthNames[m - 1], false, _ => new[] { ("B", YearRef), ("C", m.ToString()) }))
            .ToList());

    private static ReportPeriod RangePeriod(DateTime from, DateTime to)
    {
        var monthCount = (to.Year - from.Year) * 12 + to.Month - from.Month + 1;
        var prevStart = $"({StartRef}-({EndRef}-{StartRef}+1))";
        var label = $"{DateText(StartRef)}&\" — \"&{DateText(EndRef)}";
        return new ReportPeriod(
            true, 0, from.Date, to.Date, RangeRateRef,
            new[] { ("A", $"\">=\"&{StartRef}"), ("A", $"\"<=\"&{EndRef}") },
            new[] { ("A", $"\">=\"&{prevStart}"), ("A", $"\"<\"&{StartRef}") },
            label,
            $"\"davr ustuni: \"&{label}",
            "Davr",
            Enumerable.Range(0, monthCount)
                .Select(i => new MonthSlot(
                    $"EDATE(DATE(YEAR({StartRef}),MONTH({StartRef}),1),{i})", true,
                    cell => new[]
                    {
                        ("A", $"\">=\"&MAX({cell},{StartRef})"),
                        ("A", $"\"<=\"&MIN(EOMONTH({cell},0),{EndRef})")
                    }))
                .ToList());
    }

    public Task<byte[]> ExportAnnualReportAsync(int year, Guid requestingUserId, UserRole requestingUserRole) =>
        ExportPeriodReportAsync(AnnualPeriod(year), requestingUserId, requestingUserRole);

    public Task<byte[]> ExportRangeReportAsync(DateTime from, DateTime to, Guid requestingUserId, UserRole requestingUserRole) =>
        ExportPeriodReportAsync(RangePeriod(from, to), requestingUserId, requestingUserRole);

    private async Task<byte[]> ExportPeriodReportAsync(ReportPeriod period, Guid requestingUserId, UserRole requestingUserRole)
    {
        var ids = await GetAccessibleProjectIdsAsync(requestingUserId, requestingUserRole);
        var defaultRate = await _currencyService.GetUsdToUzsRateAsync();
        if (defaultRate <= 0) defaultRate = 12700m;

        var projects = await _context.Projects
            .Include(p => p.Customer)
            .Where(p => ids.Contains(p.Id))
            .OrderBy(p => p.StartDate)
            .ToListAsync();
        var payments = await _context.Payments
            .Where(p => ids.Contains(p.ProjectId))
            .OrderBy(p => p.PaymentDate)
            .ToListAsync();
        var projectExpenses = await _context.Expenses
            .Where(e => e.ProjectId != null && ids.Contains(e.ProjectId.Value))
            .OrderBy(e => e.ExpenseDate)
            .ToListAsync();
        var officeExpenses = await GetOfficeExpensesAsync(requestingUserId, requestingUserRole);
        var purchases = await _context.MaterialPurchases
            .Include(m => m.Material)
            .Where(m => ids.Contains(m.ProjectId))
            .OrderBy(m => m.PurchaseDate)
            .ToListAsync();
        var workerPayments = await _context.WorkerPayments
            .Include(w => w.Worker)
            .Where(w => ids.Contains(w.ProjectId))
            .OrderBy(w => w.PaymentDate ?? w.CreatedAt)
            .ToListAsync();
        var extraWorks = await _context.ExtraWorks
            .Where(e => ids.Contains(e.ProjectId))
            .OrderBy(e => e.ApprovedAt ?? e.CreatedAt)
            .ToListAsync();

        var codes = projects.Select((p, i) => (p.Id, Code: $"P{i + 1:000}")).ToDictionary(x => x.Id, x => x.Code);
        var names = projects.ToDictionary(p => p.Id, p => p.Name);
        string Code(Guid id) => codes.TryGetValue(id, out var c) ? c : "-";
        string Name(Guid id) => names.TryGetValue(id, out var n) ? n : "-";
        decimal Rate(decimal? r) => r.HasValue && r.Value > 0 ? r.Value : defaultRate;

        using var wb = new XLWorkbook();

        // Tahlil varaqlari birinchi ko'rinadi, xom ma'lumot varaqlari oxirida.
        var wsSummary = wb.Worksheets.Add("Xulosa");
        var wsMonthly = wb.Worksheets.Add("Oylik");
        var wsProjects = wb.Worksheets.Add("Loyihalar");
        var wsCategories = wb.Worksheets.Add("Kategoriyalar");
        var wsCustomers = wb.Worksheets.Add("Mijozlar");
        var wsWorkers = wb.Worksheets.Add("Ustalar");
        var wsMaterials = wb.Worksheets.Add("Materiallar");
        var wsOffice = wb.Worksheets.Add("Ofis");

        // ---------- XOM MA'LUMOT VARAQLARI ----------
        {
            var ws = wb.Worksheets.Add(ShPrj);
            WriteDataHeader(ws, "Kod", "Loyiha", "Mijoz", "Holat", "Progress", "Boshlanish", "Tugash",
                "Shartnoma (USD)", "Byudjet (USD)", "Loyiha turi");
            var r = 2;
            foreach (var p in projects)
            {
                ws.Cell(r, 1).Value = codes[p.Id];
                ws.Cell(r, 2).Value = p.Name;
                ws.Cell(r, 3).Value = p.Customer?.FullName ?? "-";
                ws.Cell(r, 4).Value = StatusLabel(p.Status);
                ws.Cell(r, 5).Value = p.ProgressPercent / 100m;
                ws.Cell(r, 5).Style.NumberFormat.Format = "0%";
                SetDate(ws.Cell(r, 6), p.StartDate);
                if (p.EndDate.HasValue) SetDate(ws.Cell(r, 7), p.EndDate.Value);
                ws.Cell(r, 8).Value = p.ContractAmount;
                ws.Cell(r, 9).Value = p.Budget;
                ws.Range(r, 8, r, 9).Style.NumberFormat.Format = UsdFormat;
                ws.Cell(r, 10).Value = p.ProjectType ?? "-";
                r++;
            }
            FinishDataSheet(ws, r - 1, 10);
        }
        {
            var ws = wb.Worksheets.Add(ShPay);
            WriteDataHeader(ws, "Sana", "Yil", "Oy", "Kod", "Loyiha", "Mijoz", "Summa (USD)", "To'lov usuli", "Izoh");
            var customerByProject = projects.ToDictionary(p => p.Id, p => p.Customer?.FullName ?? "-");
            var r = 2;
            foreach (var p in payments)
            {
                WriteDateCols(ws, r, p.PaymentDate);
                ws.Cell(r, 4).Value = Code(p.ProjectId);
                ws.Cell(r, 5).Value = Name(p.ProjectId);
                ws.Cell(r, 6).Value = customerByProject.TryGetValue(p.ProjectId, out var c) ? c : "-";
                ws.Cell(r, 7).Value = p.Amount;
                ws.Cell(r, 7).Style.NumberFormat.Format = UsdFormat;
                ws.Cell(r, 8).Value = PaymentMethodLabels.TryGetValue(p.PaymentMethod, out var m) ? m : p.PaymentMethod.ToString();
                ws.Cell(r, 9).Value = p.Notes ?? "";
                r++;
            }
            FinishDataSheet(ws, r - 1, 9);
        }
        {
            var ws = wb.Worksheets.Add(ShExp);
            WriteDataHeader(ws, "Sana", "Yil", "Oy", "Turi", "Kod", "Loyiha", "Kategoriya", "Guruh",
                "Summa (so'm)", "Kurs", "Summa (USD)", "Chastota", "Tavsif");
            var r = 2;
            foreach (var (e, isOffice) in projectExpenses.Select(e => (e, false)).Concat(officeExpenses.Select(e => (e, true))))
            {
                WriteDateCols(ws, r, e.ExpenseDate);
                ws.Cell(r, 4).Value = isOffice ? "Ofis" : "Loyiha";
                ws.Cell(r, 5).Value = isOffice ? "-" : Code(e.ProjectId!.Value);
                ws.Cell(r, 6).Value = isOffice ? "Ofis" : Name(e.ProjectId!.Value);
                ws.Cell(r, 7).Value = CategoryLabel(e.Category);
                ws.Cell(r, 8).Value = ExpenseGroup(e.Category);
                ws.Cell(r, 9).Value = e.Amount;
                ws.Cell(r, 9).Style.NumberFormat.Format = UzsFormat;
                ws.Cell(r, 10).Value = Rate(e.ExchangeRateToUzs);
                ws.Cell(r, 10).Style.NumberFormat.Format = UzsFormat;
                ws.Cell(r, 11).FormulaA1 = $"IF(J{r}>0,I{r}/J{r},0)";
                ws.Cell(r, 11).Style.NumberFormat.Format = UsdFormat;
                ws.Cell(r, 12).Value = e.Frequency switch
                {
                    ExpenseFrequency.Daily => "Kunlik",
                    ExpenseFrequency.Monthly => "Oylik",
                    _ => "Bir martalik"
                };
                ws.Cell(r, 13).Value = e.Description;
                r++;
            }
            FinishDataSheet(ws, r - 1, 13);
        }
        {
            var ws = wb.Worksheets.Add(ShMat);
            WriteDataHeader(ws, "Sana", "Yil", "Oy", "Kod", "Loyiha", "Material", "Brend", "Miqdor", "Birlik",
                "Birlik narxi (so'm)", "Jami (so'm)", "Kurs", "Jami (USD)", "Yetkazib beruvchi", "Chek №");
            var r = 2;
            foreach (var m in purchases)
            {
                WriteDateCols(ws, r, m.PurchaseDate);
                ws.Cell(r, 4).Value = Code(m.ProjectId);
                ws.Cell(r, 5).Value = Name(m.ProjectId);
                ws.Cell(r, 6).Value = m.Material?.Name ?? "-";
                ws.Cell(r, 7).Value = m.Brand ?? "";
                ws.Cell(r, 8).Value = m.Quantity;
                ws.Cell(r, 9).Value = m.Unit;
                ws.Cell(r, 10).Value = m.UnitPrice;
                ws.Cell(r, 11).FormulaA1 = $"H{r}*J{r}";
                ws.Cell(r, 12).Value = Rate(m.ExchangeRateToUzs);
                ws.Cell(r, 13).FormulaA1 = $"IF(L{r}>0,K{r}/L{r},0)";
                ws.Range(r, 10, r, 12).Style.NumberFormat.Format = UzsFormat;
                ws.Cell(r, 13).Style.NumberFormat.Format = UsdFormat;
                ws.Cell(r, 14).Value = string.IsNullOrWhiteSpace(m.Supplier) ? "Noma'lum" : m.Supplier.Trim();
                ws.Cell(r, 15).Value = m.ReceiptNumber ?? "";
                r++;
            }
            FinishDataSheet(ws, r - 1, 15);
        }
        {
            var ws = wb.Worksheets.Add(ShWrk);
            WriteDataHeader(ws, "Sana", "Yil", "Oy", "Kod", "Loyiha", "Usta", "Mutaxassislik", "Ish tavsifi",
                "Kelishilgan (so'm)", "Bajarilgan (so'm)", "To'langan (so'm)", "Qoldiq (so'm)", "Kurs",
                "To'langan (USD)", "Qoldiq (USD)");
            var r = 2;
            foreach (var w in workerPayments)
            {
                WriteDateCols(ws, r, w.PaymentDate ?? w.CreatedAt);
                ws.Cell(r, 4).Value = Code(w.ProjectId);
                ws.Cell(r, 5).Value = Name(w.ProjectId);
                ws.Cell(r, 6).Value = w.Worker?.FullName ?? "-";
                ws.Cell(r, 7).Value = w.Worker?.Specialty ?? "-";
                ws.Cell(r, 8).Value = w.JobDescription;
                ws.Cell(r, 9).Value = w.AgreedAmount;
                ws.Cell(r, 10).Value = w.WorkAmount;
                ws.Cell(r, 11).Value = w.PaidAmount;
                ws.Cell(r, 12).FormulaA1 = $"I{r}-K{r}";
                ws.Cell(r, 13).Value = Rate(w.ExchangeRateToUzs);
                ws.Cell(r, 14).FormulaA1 = $"IF(M{r}>0,K{r}/M{r},0)";
                ws.Cell(r, 15).FormulaA1 = $"IF(M{r}>0,L{r}/M{r},0)";
                ws.Range(r, 9, r, 13).Style.NumberFormat.Format = UzsFormat;
                ws.Range(r, 14, r, 15).Style.NumberFormat.Format = UsdFormat;
                r++;
            }
            FinishDataSheet(ws, r - 1, 15);
        }
        {
            var ws = wb.Worksheets.Add(ShExt);
            WriteDataHeader(ws, "Sana", "Yil", "Oy", "Kod", "Loyiha", "Ish nomi", "Mijoz summasi (USD)",
                "Tannarx (USD)", "Foyda (USD)", "Tasdiqlangan");
            var r = 2;
            foreach (var e in extraWorks)
            {
                WriteDateCols(ws, r, e.ApprovedAt ?? e.CreatedAt);
                ws.Cell(r, 4).Value = Code(e.ProjectId);
                ws.Cell(r, 5).Value = Name(e.ProjectId);
                ws.Cell(r, 6).Value = e.Title;
                ws.Cell(r, 7).Value = e.CustomerAmount;
                ws.Cell(r, 8).Value = e.ActualCost;
                ws.Cell(r, 9).FormulaA1 = $"G{r}-H{r}";
                ws.Range(r, 7, r, 9).Style.NumberFormat.Format = UsdFormat;
                ws.Cell(r, 10).Value = e.IsApprovedByCustomer ? "Ha" : "Yo'q";
                r++;
            }
            FinishDataSheet(ws, r - 1, 10);
        }

        // ---------- TAHLIL VARAQLARI ----------
        var projectTotalRow = BuildAnnualProjectsSheet(wsProjects, projects.Count);
        BuildAnnualSummarySheet(wsSummary, period, defaultRate, projectTotalRow);
        BuildAnnualMonthlySheet(wsMonthly, period);
        BuildAnnualCategoriesSheet(wsCategories, period);
        BuildAnnualCustomersSheet(wsCustomers, projects, projectTotalRow, period);
        BuildAnnualWorkersSheet(wsWorkers, workerPayments, period);
        BuildAnnualMaterialsSheet(wsMaterials, purchases, period);
        BuildAnnualOfficeSheet(wsOffice, officeExpenses, period);

        wsSummary.SetTabActive();
        wb.CalculateMode = XLCalculateMode.Auto;
        wb.FullCalculationOnLoad = true;

        using var stream = new MemoryStream();
        wb.SaveAs(stream);
        return stream.ToArray();
    }

    private async Task<List<Expense>> GetOfficeExpensesAsync(Guid userId, UserRole role)
    {
        var query = _context.Expenses.Where(e => e.ProjectId == null);
        if (role != UserRole.SuperAdmin)
        {
            var user = await _context.Users.FindAsync(userId);
            var tenant = user?.CompanyAdminId ?? userId;
            query = query.Where(e => e.CompanyAdminId == tenant);
        }
        return await query.OrderBy(e => e.ExpenseDate).ToListAsync();
    }

    // ================= XULOSA =================
    private static void BuildAnnualSummarySheet(IXLWorksheet ws, ReportPeriod p, decimal rate, int projectTotalRow)
    {
        ws.TabColor = XLColor.FromHtml("#1E293B");
        WriteTitle(ws, 2, 6, p.IsRange
            ? "WORKDEX — DAVR BO'YICHA MOLIYAVIY HISOBOT (OFIS + LOYIHALAR)"
            : "WORKDEX — YILLIK MOLIYAVIY HISOBOT (OFIS + LOYIHALAR)");

        IXLCell[] inputs;
        int noteRow;
        if (p.IsRange)
        {
            ws.Cell(4, 2).Value = "Boshlanish sanasi";
            SetDate(ws.Cell(4, 3), p.From);
            ws.Cell(5, 2).Value = "Tugash sanasi";
            SetDate(ws.Cell(5, 3), p.To);
            ws.Cell(6, 2).Value = "USD kursi (so'm)";
            ws.Cell(6, 3).Value = rate;
            ws.Cell(6, 3).Style.NumberFormat.Format = UzsFormat;
            ws.Cell(4, 4).Value = "Kunlar soni:";
            ws.Cell(4, 5).FormulaA1 = $"{EndRef}-{StartRef}+1";
            ws.Cell(5, 4).Value = "Oldingi davr:";
            ws.Cell(5, 5).FormulaA1 = $"{DateText($"({StartRef}-({EndRef}-{StartRef}+1))")}&\" — \"&{DateText($"({StartRef}-1)")}";
            ws.Range(4, 4, 5, 4).Style.Font.FontColor = XLColor.FromHtml("#64748B");
            ws.Range(4, 4, 5, 4).Style.Alignment.Horizontal = XLAlignmentHorizontalValues.Right;
            ws.Range(4, 5, 5, 5).Style.Alignment.Horizontal = XLAlignmentHorizontalValues.Left;
            inputs = new[] { ws.Cell(4, 3), ws.Cell(5, 3), ws.Cell(6, 3) };
            noteRow = 7;
        }
        else
        {
            ws.Cell(4, 2).Value = "Hisobot yili";
            ws.Cell(4, 3).Value = p.Year;
            ws.Cell(5, 2).Value = "USD kursi (so'm)";
            ws.Cell(5, 3).Value = rate;
            ws.Cell(5, 3).Style.NumberFormat.Format = UzsFormat;
            inputs = new[] { ws.Cell(4, 3), ws.Cell(5, 3) };
            noteRow = 6;
        }
        foreach (var c in inputs)
        {
            c.Style.Fill.BackgroundColor = XLColor.FromHtml("#FEF08A");
            c.Style.Font.Bold = true;
            c.Style.Border.OutsideBorder = XLBorderStyleValues.Medium;
            c.Style.Alignment.Horizontal = XLAlignmentHorizontalValues.Center;
        }
        ws.Range(4, 2, noteRow - 1, 2).Style.Font.Bold = true;
        ws.Cell(noteRow, 2).Value = p.IsRange
            ? "Sariq kataklardagi sanalar yoki kursni o'zgartirsangiz, barcha varaqlar avtomatik qayta hisoblanadi."
            : "Sariq kataklardagi yil yoki kursni o'zgartirsangiz, barcha varaqlar avtomatik qayta hisoblanadi.";
        ws.Range(noteRow, 2, noteRow, 6).Merge();
        ws.Cell(noteRow, 2).Style.Font.Italic = true;
        ws.Cell(noteRow, 2).Style.Font.FontColor = XLColor.FromHtml("#64748B");

        if (p.IsRange)
            StyleHeaderRow(ws, 8, 2, "#334155", "Ko'rsatkich", "Tanlangan davr (USD)", "Tanlangan davr (so'm)", "Oldingi davr (USD)", "O'zgarish");
        else
            StyleHeaderRow(ws, 8, 2, "#334155", "Ko'rsatkich", "Joriy yil (USD)", "Joriy yil (so'm)", "O'tgan yil (USD)", "O'zgarish");

        var cur = p.Cur;
        var prev = p.Prev;
        var rows = new (string Label, Func<string, (string Col, string Crit)[], string> F, string Kind)[]
        {
            ("Olingan tushum (mijoz to'lovlari)", (c, y) => SifsP(ShPay, "G", y), "income"),
            ("Material xarajatlari", (c, y) => SifsP(ShExp, "K", y, ("D", Q("Loyiha")), ("H", Q("Material"))) + "+" + SifsP(ShMat, "M", y), "cost"),
            ("Ish haqi va usta to'lovlari", (c, y) => SifsP(ShExp, "K", y, ("D", Q("Loyiha")), ("H", Q("Ish haqi"))) + "+" + SifsP(ShWrk, "N", y), "cost"),
            ("Boshqa loyiha xarajatlari", (c, y) => SifsP(ShExp, "K", y, ("D", Q("Loyiha")), ("H", Q("Boshqa"))), "cost"),
            ("Qo'shimcha ishlar tannarxi", (c, y) => SifsP(ShExt, "H", y, ("J", Q("Ha"))), "cost"),
            ("JAMI LOYIHA XARAJATLARI", (c, y) => $"SUM({c}10:{c}13)", "subtotal"),
            ("YALPI FOYDA (tushum − loyiha xarajatlari)", (c, y) => $"{c}9-{c}14", "subtotal"),
            ("Ofis xarajatlari", (c, y) => SifsP(ShExp, "K", y, ("D", Q("Ofis"))), "cost"),
            ("JAMI CHIQIM", (c, y) => $"{c}14+{c}16", "subtotal"),
            ("SOF FOYDA", (c, y) => $"{c}9-{c}17", "profit"),
            ("Sof foyda marjasi", (c, y) => $"IF({c}9=0,0,{c}18/{c}9)", "pct"),
            ("Qo'shimcha ishlar daromadi (tasdiqlangan)", (c, y) => SifsP(ShExt, "G", y, ("J", Q("Ha"))), "info"),
        };

        var r = 9;
        foreach (var (label, f, kind) in rows)
        {
            ws.Cell(r, 2).Value = label;
            ws.Cell(r, 3).FormulaA1 = f("C", cur);
            ws.Cell(r, 5).FormulaA1 = f("E", prev);
            if (kind == "pct")
            {
                ws.Range(r, 3, r, 6).Style.NumberFormat.Format = PctFormat;
                ws.Cell(r, 6).FormulaA1 = $"C{r}-E{r}";
            }
            else
            {
                ws.Cell(r, 4).FormulaA1 = $"C{r}*{p.RateRef}";
                ws.Cell(r, 6).FormulaA1 = $"IF(E{r}=0,\"\",(C{r}-E{r})/ABS(E{r}))";
                ws.Cell(r, 3).Style.NumberFormat.Format = UsdFormat;
                ws.Cell(r, 4).Style.NumberFormat.Format = UzsFormat;
                ws.Cell(r, 5).Style.NumberFormat.Format = UsdFormat;
                ws.Cell(r, 6).Style.NumberFormat.Format = PctFormat;
            }

            var range = ws.Range(r, 2, r, 6);
            switch (kind)
            {
                case "income": range.Style.Fill.BackgroundColor = XLColor.FromHtml("#ECFDF5"); break;
                case "subtotal": range.Style.Font.Bold = true; range.Style.Fill.BackgroundColor = XLColor.FromHtml("#E2E8F0"); break;
                case "profit":
                    range.Style.Font.Bold = true;
                    range.Style.Font.FontSize = 12;
                    range.Style.Fill.BackgroundColor = XLColor.FromHtml("#DCFCE7");
                    break;
                case "info": range.Style.Font.Italic = true; break;
            }
            r++;
        }
        ApplyTableBorders(ws, 8, r - 1, 6, 2);

        // Umumiy holat (barcha davr)
        r += 1;
        StyleHeaderRow(ws, r, 2, "#0F766E", "Umumiy holat (barcha davr)", "Qiymat");
        r++;
        var statusStart = r;
        var totals = new (string Label, string Formula, string Format)[]
        {
            ("Loyihalar soni", $"COUNTA('{ShPrj}'!A:A)-1", "0"),
            ("Faol loyihalar", $"COUNTIF('{ShPrj}'!D:D,\"Faol\")", "0"),
            ("Rejalashtirilayotgan", $"COUNTIF('{ShPrj}'!D:D,\"Rejalashtirish\")", "0"),
            ("Kechikkan / to'xtatilgan", $"COUNTIF('{ShPrj}'!D:D,\"Kechikkan\")", "0"),
            ("Yakunlangan", $"COUNTIF('{ShPrj}'!D:D,\"Yakunlangan\")", "0"),
            ("O'rtacha bajarilish (progress)", $"IFERROR(AVERAGE('{ShPrj}'!E:E),0)", "0.0%"),
            ("Shartnomalar portfeli (USD)", $"'Loyihalar'!G{projectTotalRow}", UsdFormat),
            ("Mijozlar qarzi — debitorlik (USD)", $"'Loyihalar'!I{projectTotalRow}", UsdFormat),
            ("Ustalarga qarz (so'm)", $"SUM('{ShWrk}'!L:L)", UzsFormat),
            ("Ustalarga qarz (USD)", $"SUM('{ShWrk}'!O:O)", UsdFormat),
            ("Loyihalar kutilayotgan foydasi (USD)", $"'Loyihalar'!O{projectTotalRow}", UsdFormat),
        };
        foreach (var (label, formula, format) in totals)
        {
            ws.Cell(r, 2).Value = label;
            ws.Cell(r, 3).FormulaA1 = formula;
            ws.Cell(r, 3).Style.NumberFormat.Format = format;
            r++;
        }
        ApplyTableBorders(ws, statusStart - 1, r - 1, 3, 2);

        // To'lov usullari (tanlangan yil / davr)
        r += 1;
        StyleHeaderRow(ws, r, 2, "#059669", $"To'lov usullari ({p.Word.ToLowerInvariant()})", "Summa (USD)", "Ulush");
        r++;
        var payStart = r;
        foreach (var label in PaymentMethodLabels.Values)
        {
            ws.Cell(r, 2).Value = label;
            ws.Cell(r, 3).FormulaA1 = SifsP(ShPay, "G", cur, ("H", Q(label)));
            ws.Cell(r, 4).FormulaA1 = $"IF($C$9=0,0,C{r}/$C$9)";
            ws.Cell(r, 3).Style.NumberFormat.Format = UsdFormat;
            ws.Cell(r, 4).Style.NumberFormat.Format = PctFormat;
            r++;
        }
        ws.Range(payStart, 4, r - 1, 4).AddConditionalFormat().DataBar(XLColor.FromHtml("#34D399")).LowestValue().HighestValue();
        ApplyTableBorders(ws, payStart - 1, r - 1, 4, 2);

        ws.Column(1).Width = 3;
        ws.Column(2).Width = 44;
        ws.Columns(3, 6).Width = 20;
        ws.SheetView.FreezeRows(8);
    }

    // ================= OYLIK =================
    private static void BuildAnnualMonthlySheet(IXLWorksheet ws, ReportPeriod p)
    {
        ws.TabColor = XLColor.FromHtml("#2563EB");
        WriteTitleFormula(ws, 1, 10, $"\"OYLIK TAHLIL — \"&{p.Label}&\" (USD)\"");
        StyleHeaderRow(ws, 3, 1, "#2563EB", "Oy", "Tushum", "Material", "Ish haqi", "Boshqa loyiha",
            "Ofis", "Jami chiqim", "Sof foyda", "Kumulyativ foyda", "Marja");

        for (var i = 0; i < p.Months.Count; i++)
        {
            var r = i + 4;
            var slot = p.Months[i];
            if (slot.IsFormula)
            {
                ws.Cell(r, 1).FormulaA1 = slot.Label;
                ws.Cell(r, 1).Style.DateFormat.Format = "mm.yyyy";
                ws.Cell(r, 1).Style.Alignment.Horizontal = XLAlignmentHorizontalValues.Left;
            }
            else
            {
                ws.Cell(r, 1).Value = slot.Label;
            }
            var mk = slot.Criteria($"$A{r}");
            ws.Cell(r, 2).FormulaA1 = SifsP(ShPay, "G", mk);
            ws.Cell(r, 3).FormulaA1 = SifsP(ShExp, "K", mk, ("D", Q("Loyiha")), ("H", Q("Material")))
                + "+" + SifsP(ShMat, "M", mk);
            ws.Cell(r, 4).FormulaA1 = SifsP(ShExp, "K", mk, ("D", Q("Loyiha")), ("H", Q("Ish haqi")))
                + "+" + SifsP(ShWrk, "N", mk);
            ws.Cell(r, 5).FormulaA1 = SifsP(ShExp, "K", mk, ("D", Q("Loyiha")), ("H", Q("Boshqa")))
                + "+" + SifsP(ShExt, "H", mk, ("J", Q("Ha")));
            ws.Cell(r, 6).FormulaA1 = SifsP(ShExp, "K", mk, ("D", Q("Ofis")));
            ws.Cell(r, 7).FormulaA1 = $"SUM(C{r}:F{r})";
            ws.Cell(r, 8).FormulaA1 = $"B{r}-G{r}";
            ws.Cell(r, 9).FormulaA1 = i == 0 ? $"H{r}" : $"I{r - 1}+H{r}";
            ws.Cell(r, 10).FormulaA1 = $"IF(B{r}=0,\"\",H{r}/B{r})";
        }

        var lastM = p.Months.Count + 3;
        var tot = lastM + 1;
        ws.Cell(tot, 1).Value = "JAMI";
        for (var c = 2; c <= 8; c++)
        {
            var col = ColLetter(c);
            ws.Cell(tot, c).FormulaA1 = $"SUM({col}4:{col}{lastM})";
            ws.Cell(tot + 1, c).FormulaA1 = $"AVERAGE({col}4:{col}{lastM})";
        }
        ws.Cell(tot, 9).FormulaA1 = $"I{lastM}";
        ws.Cell(tot, 10).FormulaA1 = $"IF(B{tot}=0,\"\",H{tot}/B{tot})";
        ws.Cell(tot + 1, 1).Value = "O'rtacha oylik";

        ws.Range(4, 2, tot + 1, 9).Style.NumberFormat.Format = UsdFormat;
        ws.Range(4, 10, tot, 10).Style.NumberFormat.Format = PctFormat;
        StyleTotalRow(ws.Range(tot, 1, tot, 10));
        ws.Range(tot + 1, 1, tot + 1, 10).Style.Font.Italic = true;

        ws.Range(4, 2, lastM, 2).AddConditionalFormat().DataBar(XLColor.FromHtml("#34D399")).LowestValue().HighestValue();
        ws.Range(4, 7, lastM, 7).AddConditionalFormat().DataBar(XLColor.FromHtml("#F87171")).LowestValue().HighestValue();
        AddRedGreenScale(ws.Range(4, 8, lastM, 8));

        ApplyTableBorders(ws, 3, tot + 1, 10);
        ws.Column(1).Width = 16;
        ws.Columns(2, 10).Width = 16;
        ws.SheetView.FreezeRows(3);
    }

    // ================= LOYIHALAR (barcha davr) =================
    private static int BuildAnnualProjectsSheet(IXLWorksheet ws, int count)
    {
        ws.TabColor = XLColor.FromHtml("#EA580C");
        WriteTitle(ws, 1, 20, "LOYIHALAR RENTABELLIGI (loyiha boshidan hozirgacha, USD)");
        StyleHeaderRow(ws, 3, 1, "#EA580C", "Kod", "Loyiha", "Mijoz", "Holat", "Shartnoma", "Qo'shimcha ish daromadi",
            "Jami daromad", "Olingan", "Qoldiq qarz", "To'lov %", "Material", "Ish haqi", "Boshqa",
            "Jami xarajat", "Foyda", "Marja", "Byudjet", "Byudjet ishlatilishi", "Progress", "Naqd balans");

        for (var i = 0; i < count; i++)
        {
            var r = i + 4;
            var d = i + 2;
            var code = $"$A{r}";
            ws.Cell(r, 1).FormulaA1 = $"'{ShPrj}'!A{d}";
            ws.Cell(r, 2).FormulaA1 = $"'{ShPrj}'!B{d}";
            ws.Cell(r, 3).FormulaA1 = $"'{ShPrj}'!C{d}";
            ws.Cell(r, 4).FormulaA1 = $"'{ShPrj}'!D{d}";
            ws.Cell(r, 5).FormulaA1 = $"'{ShPrj}'!H{d}";
            ws.Cell(r, 6).FormulaA1 = Sifs(ShExt, "G", ("D", code), ("J", Q("Ha")));
            ws.Cell(r, 7).FormulaA1 = $"E{r}+F{r}";
            ws.Cell(r, 8).FormulaA1 = Sifs(ShPay, "G", ("D", code));
            ws.Cell(r, 9).FormulaA1 = $"G{r}-H{r}";
            ws.Cell(r, 10).FormulaA1 = $"IF(G{r}=0,0,H{r}/G{r})";
            ws.Cell(r, 11).FormulaA1 = Sifs(ShExp, "K", ("E", code), ("H", Q("Material"))) + "+" + Sifs(ShMat, "M", ("D", code));
            ws.Cell(r, 12).FormulaA1 = Sifs(ShExp, "K", ("E", code), ("H", Q("Ish haqi"))) + "+" + Sifs(ShWrk, "N", ("D", code));
            ws.Cell(r, 13).FormulaA1 = Sifs(ShExp, "K", ("E", code), ("H", Q("Boshqa"))) + "+" + Sifs(ShExt, "H", ("D", code), ("J", Q("Ha")));
            ws.Cell(r, 14).FormulaA1 = $"K{r}+L{r}+M{r}";
            ws.Cell(r, 15).FormulaA1 = $"G{r}-N{r}";
            ws.Cell(r, 16).FormulaA1 = $"IF(G{r}=0,0,O{r}/G{r})";
            ws.Cell(r, 17).FormulaA1 = $"'{ShPrj}'!I{d}";
            ws.Cell(r, 18).FormulaA1 = $"IF(Q{r}=0,0,N{r}/Q{r})";
            ws.Cell(r, 19).FormulaA1 = $"'{ShPrj}'!E{d}";
            ws.Cell(r, 20).FormulaA1 = $"H{r}-N{r}";
        }

        var last = count + 3;
        var tot = count + 4;
        ws.Cell(tot, 2).Value = "JAMI";
        foreach (var c in new[] { 5, 6, 7, 8, 9, 11, 12, 13, 14, 15, 17, 20 })
        {
            var col = ColLetter(c);
            ws.Cell(tot, c).FormulaA1 = $"SUM({col}4:{col}{last})";
        }
        ws.Cell(tot, 10).FormulaA1 = $"IF(G{tot}=0,0,H{tot}/G{tot})";
        ws.Cell(tot, 16).FormulaA1 = $"IF(G{tot}=0,0,O{tot}/G{tot})";
        ws.Cell(tot, 18).FormulaA1 = $"IF(Q{tot}=0,0,N{tot}/Q{tot})";
        ws.Cell(tot, 19).FormulaA1 = $"IFERROR(AVERAGE(S4:S{last}),0)";

        ws.Range(4, 5, tot, 9).Style.NumberFormat.Format = UsdFormat;
        ws.Range(4, 11, tot, 15).Style.NumberFormat.Format = UsdFormat;
        ws.Range(4, 17, tot, 17).Style.NumberFormat.Format = UsdFormat;
        ws.Range(4, 20, tot, 20).Style.NumberFormat.Format = UsdFormat;
        foreach (var c in new[] { 10, 16, 18, 19 })
            ws.Range(4, c, tot, c).Style.NumberFormat.Format = PctFormat;
        StyleTotalRow(ws.Range(tot, 1, tot, 20));

        if (count > 0)
        {
            AddRedGreenScale(ws.Range(4, 16, last, 16));
            ws.Range(4, 18, last, 18).AddConditionalFormat().WhenGreaterThan(1)
                .Fill.SetBackgroundColor(XLColor.FromHtml("#FECACA"));
            ws.Range(4, 9, last, 9).AddConditionalFormat().DataBar(XLColor.FromHtml("#FB923C")).LowestValue().HighestValue();
            ws.Range(4, 19, last, 19).AddConditionalFormat().DataBar(XLColor.FromHtml("#60A5FA")).LowestValue().HighestValue();
        }

        ApplyTableBorders(ws, 3, tot, 20);
        ws.Column(1).Width = 8;
        ws.Column(2).Width = 32;
        ws.Column(3).Width = 24;
        ws.Column(4).Width = 14;
        ws.Columns(5, 20).Width = 15;
        ws.Row(3).Style.Alignment.WrapText = true;
        ws.Row(3).Height = 32;
        ws.SheetView.Freeze(3, 2);
        return tot;
    }

    // ================= KATEGORIYALAR =================
    private static void BuildAnnualCategoriesSheet(IXLWorksheet ws, ReportPeriod p)
    {
        ws.TabColor = XLColor.FromHtml("#DC2626");
        WriteTitleFormula(ws, 1, 5, $"\"XARAJATLAR KATEGORIYALAR BO'YICHA — \"&{p.Label}&\" (USD)\"");
        StyleHeaderRow(ws, 3, 1, "#DC2626", "Kategoriya", "Loyiha xarajati", "Ofis xarajati", "Jami", "Ulush");

        var r = 4;
        foreach (var label in CategoryLabels.Values)
        {
            ws.Cell(r, 1).Value = label;
            ws.Cell(r, 2).FormulaA1 = SifsP(ShExp, "K", p.Cur, ("D", Q("Loyiha")), ("G", Q(label)));
            ws.Cell(r, 3).FormulaA1 = SifsP(ShExp, "K", p.Cur, ("D", Q("Ofis")), ("G", Q(label)));
            r++;
        }
        var extras = new (string Label, string Formula)[]
        {
            ("Material xaridlari (katalogdan)", SifsP(ShMat, "M", p.Cur)),
            ("Usta to'lovlari", SifsP(ShWrk, "N", p.Cur)),
            ("Qo'shimcha ishlar tannarxi", SifsP(ShExt, "H", p.Cur, ("J", Q("Ha")))),
        };
        foreach (var (label, formula) in extras)
        {
            ws.Cell(r, 1).Value = label;
            ws.Cell(r, 2).FormulaA1 = formula;
            ws.Cell(r, 3).Value = 0;
            r++;
        }

        var last = r - 1;
        var tot = r;
        for (var i = 4; i <= last; i++)
        {
            ws.Cell(i, 4).FormulaA1 = $"B{i}+C{i}";
            ws.Cell(i, 5).FormulaA1 = $"IF($D${tot}=0,0,D{i}/$D${tot})";
        }
        ws.Cell(tot, 1).Value = "JAMI";
        foreach (var c in new[] { 2, 3, 4 })
        {
            var col = ColLetter(c);
            ws.Cell(tot, c).FormulaA1 = $"SUM({col}4:{col}{last})";
        }
        ws.Cell(tot, 5).FormulaA1 = $"SUM(E4:E{last})";

        ws.Range(4, 2, tot, 4).Style.NumberFormat.Format = UsdFormat;
        ws.Range(4, 5, tot, 5).Style.NumberFormat.Format = PctFormat;
        ws.Range(4, 4, last, 4).AddConditionalFormat().DataBar(XLColor.FromHtml("#F87171")).LowestValue().HighestValue();
        StyleTotalRow(ws.Range(tot, 1, tot, 5));
        ApplyTableBorders(ws, 3, tot, 5);
        ws.Column(1).Width = 34;
        ws.Columns(2, 5).Width = 18;
        ws.SheetView.FreezeRows(3);
    }

    // ================= MIJOZLAR =================
    private static void BuildAnnualCustomersSheet(IXLWorksheet ws, List<Project> projects, int projectTotalRow, ReportPeriod p)
    {
        ws.TabColor = XLColor.FromHtml("#7C3AED");
        WriteTitleFormula(ws, 1, 8, $"\"MIJOZLAR TAHLILI (USD) — \"&{p.Note}");
        StyleHeaderRow(ws, 3, 1, "#7C3AED", "Mijoz", "Loyihalar soni", "Jami daromad", "Olingan", "Qarz",
            "Kutilayotgan foyda", $"{p.Word} tushumi", $"{p.Word} tushumi ulushi");

        var customers = projects.Select(p => p.Customer?.FullName ?? "-").Distinct().OrderBy(x => x).ToList();
        var pLast = Math.Max(projectTotalRow - 1, 4);
        string Rng(string col) => $"'Loyihalar'!${col}$4:${col}${pLast}";

        var r = 4;
        foreach (var name in customers)
        {
            var key = $"$A{r}";
            ws.Cell(r, 1).Value = name;
            ws.Cell(r, 2).FormulaA1 = $"COUNTIF({Rng("C")},{key})";
            ws.Cell(r, 3).FormulaA1 = $"SUMIF({Rng("C")},{key},{Rng("G")})";
            ws.Cell(r, 4).FormulaA1 = $"SUMIF({Rng("C")},{key},{Rng("H")})";
            ws.Cell(r, 5).FormulaA1 = $"SUMIF({Rng("C")},{key},{Rng("I")})";
            ws.Cell(r, 6).FormulaA1 = $"SUMIF({Rng("C")},{key},{Rng("O")})";
            ws.Cell(r, 7).FormulaA1 = SifsP(ShPay, "G", new[] { ("F", key) }, p.Cur);
            r++;
        }
        var last = r - 1;
        var tot = r;
        for (var i = 4; i <= last; i++)
            ws.Cell(i, 8).FormulaA1 = $"IF($G${tot}=0,0,G{i}/$G${tot})";

        ws.Cell(tot, 1).Value = "JAMI";
        for (var c = 2; c <= 7; c++)
        {
            var col = ColLetter(c);
            ws.Cell(tot, c).FormulaA1 = $"SUM({col}4:{col}{last})";
        }
        ws.Range(4, 3, tot, 7).Style.NumberFormat.Format = UsdFormat;
        ws.Range(4, 8, tot, 8).Style.NumberFormat.Format = PctFormat;
        if (customers.Count > 0)
            ws.Range(4, 5, last, 5).AddConditionalFormat().DataBar(XLColor.FromHtml("#FB923C")).LowestValue().HighestValue();
        StyleTotalRow(ws.Range(tot, 1, tot, 8));
        ApplyTableBorders(ws, 3, tot, 8);
        ws.Column(1).Width = 32;
        ws.Columns(2, 8).Width = 17;
        ws.SheetView.FreezeRows(3);
    }

    // ================= USTALAR =================
    private static void BuildAnnualWorkersSheet(IXLWorksheet ws, List<WorkerPayment> workerPayments, ReportPeriod p)
    {
        ws.TabColor = XLColor.FromHtml("#0D9488");
        WriteTitleFormula(ws, 1, 10, $"\"USTALAR VA ISH HAQI TAHLILI — \"&{p.Note}");
        StyleHeaderRow(ws, 3, 1, "#0D9488", "Usta", "Mutaxassislik", "Ishlar soni", "Kelishilgan (so'm)",
            "Bajarilgan (so'm)", "To'langan (so'm)", "Qoldiq (so'm)", "To'langan (USD)", $"{p.Word} to'lovi (USD)", "To'lov %");

        var workers = workerPayments
            .GroupBy(w => w.Worker?.FullName ?? "-")
            .Select(g => (Name: g.Key, Specialty: g.First().Worker?.Specialty ?? "-"))
            .OrderBy(x => x.Name)
            .ToList();

        var r = 4;
        foreach (var (name, specialty) in workers)
        {
            var key = $"$A{r}";
            ws.Cell(r, 1).Value = name;
            ws.Cell(r, 2).Value = specialty;
            ws.Cell(r, 3).FormulaA1 = $"COUNTIF('{ShWrk}'!F:F,{key})";
            ws.Cell(r, 4).FormulaA1 = $"SUMIF('{ShWrk}'!F:F,{key},'{ShWrk}'!I:I)";
            ws.Cell(r, 5).FormulaA1 = $"SUMIF('{ShWrk}'!F:F,{key},'{ShWrk}'!J:J)";
            ws.Cell(r, 6).FormulaA1 = $"SUMIF('{ShWrk}'!F:F,{key},'{ShWrk}'!K:K)";
            ws.Cell(r, 7).FormulaA1 = $"SUMIF('{ShWrk}'!F:F,{key},'{ShWrk}'!L:L)";
            ws.Cell(r, 8).FormulaA1 = $"SUMIF('{ShWrk}'!F:F,{key},'{ShWrk}'!N:N)";
            ws.Cell(r, 9).FormulaA1 = SifsP(ShWrk, "N", new[] { ("F", key) }, p.Cur);
            ws.Cell(r, 10).FormulaA1 = $"IF(D{r}=0,0,F{r}/D{r})";
            r++;
        }
        var last = r - 1;
        var tot = r;
        ws.Cell(tot, 1).Value = "JAMI";
        for (var c = 3; c <= 9; c++)
        {
            var col = ColLetter(c);
            ws.Cell(tot, c).FormulaA1 = $"SUM({col}4:{col}{last})";
        }
        ws.Cell(tot, 10).FormulaA1 = $"IF(D{tot}=0,0,F{tot}/D{tot})";

        ws.Range(4, 4, tot, 7).Style.NumberFormat.Format = UzsFormat;
        ws.Range(4, 8, tot, 9).Style.NumberFormat.Format = UsdFormat;
        ws.Range(4, 10, tot, 10).Style.NumberFormat.Format = PctFormat;
        if (workers.Count > 0)
            ws.Range(4, 7, last, 7).AddConditionalFormat().DataBar(XLColor.FromHtml("#F87171")).LowestValue().HighestValue();
        StyleTotalRow(ws.Range(tot, 1, tot, 10));
        ApplyTableBorders(ws, 3, tot, 10);
        ws.Column(1).Width = 26;
        ws.Column(2).Width = 22;
        ws.Columns(3, 10).Width = 17;
        ws.SheetView.FreezeRows(3);
    }

    // ================= MATERIALLAR =================
    private static void BuildAnnualMaterialsSheet(IXLWorksheet ws, List<MaterialPurchase> purchases, ReportPeriod p)
    {
        ws.TabColor = XLColor.FromHtml("#D97706");
        WriteTitleFormula(ws, 1, 8, $"\"MATERIALLAR TAHLILI — \"&{p.Note}");
        StyleHeaderRow(ws, 3, 1, "#D97706", "Material", "Birlik", "Xaridlar soni", "Jami miqdor",
            "Jami (so'm)", "Jami (USD)", "O'rtacha narx (so'm)", $"{p.Word} xarajati (USD)");

        var materials = purchases
            .GroupBy(m => m.Material?.Name ?? "-")
            .Select(g => (Name: g.Key, Unit: g.First().Unit))
            .OrderBy(x => x.Name)
            .ToList();

        var r = 4;
        foreach (var (name, unit) in materials)
        {
            var key = $"$A{r}";
            ws.Cell(r, 1).Value = name;
            ws.Cell(r, 2).Value = unit;
            ws.Cell(r, 3).FormulaA1 = $"COUNTIF('{ShMat}'!F:F,{key})";
            ws.Cell(r, 4).FormulaA1 = $"SUMIF('{ShMat}'!F:F,{key},'{ShMat}'!H:H)";
            ws.Cell(r, 5).FormulaA1 = $"SUMIF('{ShMat}'!F:F,{key},'{ShMat}'!K:K)";
            ws.Cell(r, 6).FormulaA1 = $"SUMIF('{ShMat}'!F:F,{key},'{ShMat}'!M:M)";
            ws.Cell(r, 7).FormulaA1 = $"IF(D{r}=0,0,E{r}/D{r})";
            ws.Cell(r, 8).FormulaA1 = SifsP(ShMat, "M", new[] { ("F", key) }, p.Cur);
            r++;
        }
        var last = r - 1;
        var tot = r;
        ws.Cell(tot, 1).Value = "JAMI";
        foreach (var c in new[] { 3, 5, 6, 8 })
        {
            var col = ColLetter(c);
            ws.Cell(tot, c).FormulaA1 = $"SUM({col}4:{col}{last})";
        }
        ws.Range(4, 4, tot, 4).Style.NumberFormat.Format = "#,##0.##";
        ws.Range(4, 5, tot, 5).Style.NumberFormat.Format = UzsFormat;
        ws.Range(4, 6, tot, 6).Style.NumberFormat.Format = UsdFormat;
        ws.Range(4, 7, tot, 7).Style.NumberFormat.Format = UzsFormat;
        ws.Range(4, 8, tot, 8).Style.NumberFormat.Format = UsdFormat;
        if (materials.Count > 0)
            ws.Range(4, 6, last, 6).AddConditionalFormat().DataBar(XLColor.FromHtml("#FBBF24")).LowestValue().HighestValue();
        StyleTotalRow(ws.Range(tot, 1, tot, 8));
        ApplyTableBorders(ws, 3, tot, 8);

        // Yetkazib beruvchilar
        var sHead = tot + 3;
        StyleHeaderRow(ws, sHead, 1, "#92400E", "Yetkazib beruvchi", "Xaridlar soni", "Jami (USD)", $"{p.Word} xarajati (USD)", "Ulush (jami)");
        var suppliers = purchases
            .Select(m => string.IsNullOrWhiteSpace(m.Supplier) ? "Noma'lum" : m.Supplier.Trim())
            .Distinct()
            .OrderBy(x => x)
            .ToList();
        r = sHead + 1;
        foreach (var s in suppliers)
        {
            var key = $"$A{r}";
            ws.Cell(r, 1).Value = s;
            ws.Cell(r, 2).FormulaA1 = $"COUNTIF('{ShMat}'!N:N,{key})";
            ws.Cell(r, 3).FormulaA1 = $"SUMIF('{ShMat}'!N:N,{key},'{ShMat}'!M:M)";
            ws.Cell(r, 4).FormulaA1 = SifsP(ShMat, "M", new[] { ("N", key) }, p.Cur);
            r++;
        }
        var sLast = r - 1;
        var sTot = r;
        for (var i = sHead + 1; i <= sLast; i++)
            ws.Cell(i, 5).FormulaA1 = $"IF($C${sTot}=0,0,C{i}/$C${sTot})";
        ws.Cell(sTot, 1).Value = "JAMI";
        foreach (var c in new[] { 2, 3, 4 })
        {
            var col = ColLetter(c);
            ws.Cell(sTot, c).FormulaA1 = $"SUM({col}{sHead + 1}:{col}{sLast})";
        }
        ws.Range(sHead + 1, 3, sTot, 4).Style.NumberFormat.Format = UsdFormat;
        ws.Range(sHead + 1, 5, sTot, 5).Style.NumberFormat.Format = PctFormat;
        StyleTotalRow(ws.Range(sTot, 1, sTot, 5));
        ApplyTableBorders(ws, sHead, sTot, 5);

        ws.Column(1).Width = 32;
        ws.Columns(2, 8).Width = 17;
        ws.SheetView.FreezeRows(3);
    }

    // ================= OFIS =================
    private static void BuildAnnualOfficeSheet(IXLWorksheet ws, List<Expense> officeExpenses, ReportPeriod p)
    {
        var n = p.Months.Count;
        var sumCol = n + 2;
        var avgCol = n + 3;
        var lastMonthCol = ColLetter(n + 1);
        ws.TabColor = XLColor.FromHtml("#475569");
        WriteTitleFormula(ws, 1, avgCol, $"\"OFIS XARAJATLARI OYLAR BO'YICHA — \"&{p.Label}&\" (USD)\"");
        var headers = new List<string> { "Kategoriya" };
        headers.AddRange(p.Months.Select(m => m.IsFormula ? "" : m.Label));
        headers.Add("Jami");
        headers.Add("O'rtacha oylik");
        StyleHeaderRow(ws, 3, 1, "#475569", headers.ToArray());
        for (var i = 0; i < n; i++)
        {
            if (!p.Months[i].IsFormula) continue;
            var cell = ws.Cell(3, i + 2);
            cell.FormulaA1 = p.Months[i].Label;
            cell.Style.DateFormat.Format = "mm.yyyy";
        }

        var categories = officeExpenses.Select(e => CategoryLabel(e.Category)).Distinct().OrderBy(x => x).ToList();
        var r = 4;
        foreach (var cat in categories)
        {
            ws.Cell(r, 1).Value = cat;
            for (var i = 0; i < n; i++)
            {
                var monthCell = $"{ColLetter(i + 2)}$3";
                ws.Cell(r, i + 2).FormulaA1 = SifsP(ShExp, "K", new[] { ("D", Q("Ofis")), ("G", $"$A{r}") }, p.Months[i].Criteria(monthCell));
            }
            ws.Cell(r, sumCol).FormulaA1 = $"SUM(B{r}:{lastMonthCol}{r})";
            ws.Cell(r, avgCol).FormulaA1 = $"{ColLetter(sumCol)}{r}/{n}";
            r++;
        }
        var last = r - 1;
        var tot = r;
        ws.Cell(tot, 1).Value = "JAMI";
        for (var c = 2; c <= avgCol; c++)
        {
            var col = ColLetter(c);
            ws.Cell(tot, c).FormulaA1 = $"SUM({col}4:{col}{last})";
        }
        ws.Range(4, 2, tot, avgCol).Style.NumberFormat.Format = UsdFormat;
        if (categories.Count > 0)
            AddRedGreenScale(ws.Range(4, 2, last, n + 1), reverse: true);
        StyleTotalRow(ws.Range(tot, 1, tot, avgCol));
        ApplyTableBorders(ws, 3, tot, avgCol);
        ws.Column(1).Width = 24;
        ws.Columns(2, avgCol).Width = 13;
        ws.SheetView.Freeze(3, 1);
    }

    // ================= YORDAMCHI =================
    private static void WriteDataHeader(IXLWorksheet ws, params string[] headers)
    {
        ws.TabColor = XLColor.FromHtml("#94A3B8");
        ApplyHeaders(ws, headers, "#64748B");
        ws.SheetView.FreezeRows(1);
    }

    private static void FinishDataSheet(IXLWorksheet ws, int lastRow, int cols)
    {
        ws.Range(1, 1, Math.Max(lastRow, 1), cols).SetAutoFilter();
        ApplyTableBorders(ws, 1, lastRow, cols);
        ws.Columns(1, cols).Width = 15;
        ws.Column(5).Width = 26;
    }

    private static void SetDate(IXLCell cell, DateTime date)
    {
        cell.Value = date.Date;
        cell.Style.DateFormat.Format = "dd.MM.yyyy";
    }

    // A: sana, B: =YEAR(A), C: =MONTH(A)
    private static void WriteDateCols(IXLWorksheet ws, int r, DateTime date)
    {
        SetDate(ws.Cell(r, 1), date);
        ws.Cell(r, 2).FormulaA1 = $"YEAR(A{r})";
        ws.Cell(r, 3).FormulaA1 = $"MONTH(A{r})";
    }

    private static void WriteTitle(IXLWorksheet ws, int firstCol, int lastCol, string text)
    {
        ws.Cell(1, firstCol).Value = text;
        StyleTitle(ws.Range(1, firstCol, 1, lastCol));
    }

    private static void WriteTitleFormula(IXLWorksheet ws, int firstCol, int lastCol, string formula)
    {
        ws.Cell(1, firstCol).FormulaA1 = formula;
        StyleTitle(ws.Range(1, firstCol, 1, lastCol));
    }

    private static void StyleTitle(IXLRange range)
    {
        range.Merge();
        range.Style.Font.Bold = true;
        range.Style.Font.FontSize = 13;
        range.Style.Font.FontColor = XLColor.White;
        range.Style.Fill.BackgroundColor = XLColor.FromHtml("#1E293B");
        range.Style.Alignment.Horizontal = XLAlignmentHorizontalValues.Center;
        range.Style.Alignment.Vertical = XLAlignmentVerticalValues.Center;
        range.Worksheet.Row(range.FirstRow().RowNumber()).Height = 30;
    }

    private static void StyleHeaderRow(IXLWorksheet ws, int row, int firstCol, string hexColor, params string[] headers)
    {
        for (var i = 0; i < headers.Length; i++)
        {
            var cell = ws.Cell(row, firstCol + i);
            cell.Value = headers[i];
            cell.Style.Font.Bold = true;
            cell.Style.Font.FontColor = XLColor.White;
            cell.Style.Fill.BackgroundColor = XLColor.FromHtml(hexColor);
            cell.Style.Alignment.Horizontal = XLAlignmentHorizontalValues.Center;
            cell.Style.Alignment.Vertical = XLAlignmentVerticalValues.Center;
            cell.Style.Alignment.WrapText = true;
        }
        ws.Row(row).Height = 28;
    }

    private static void StyleTotalRow(IXLRange range)
    {
        range.Style.Font.Bold = true;
        range.Style.Fill.BackgroundColor = XLColor.FromHtml("#E2E8F0");
        range.Style.Border.TopBorder = XLBorderStyleValues.Medium;
    }

    private static void AddRedGreenScale(IXLRange range, bool reverse = false)
    {
        var low = XLColor.FromHtml(reverse ? "#63BE7B" : "#F8696B");
        var high = XLColor.FromHtml(reverse ? "#F8696B" : "#63BE7B");
        range.AddConditionalFormat().ColorScale()
            .LowestValue(low)
            .Midpoint(XLCFContentType.Percentile, 50, XLColor.FromHtml("#FFEB84"))
            .HighestValue(high);
    }

    private static void ApplyTableBorders(IXLWorksheet ws, int startRow, int endRow, int lastCol, int firstCol)
    {
        if (endRow < startRow) return;
        var range = ws.Range(startRow, firstCol, endRow, lastCol);
        range.Style.Border.SetOutsideBorder(XLBorderStyleValues.Medium);
        range.Style.Border.SetOutsideBorderColor(XLColor.FromHtml("#94A3B8"));
        range.Style.Border.SetInsideBorder(XLBorderStyleValues.Thin);
        range.Style.Border.SetInsideBorderColor(XLColor.FromHtml("#CBD5E1"));
    }

    private static string ColLetter(int col) => XLHelper.GetColumnLetterFromNumber(col);
}

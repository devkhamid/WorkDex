using System.Globalization;
using System.Text;
using System.Text.RegularExpressions;
using ClosedXML.Excel;
using Microsoft.EntityFrameworkCore;
using WorkDex.Api.DTOs.Workers;
using WorkDex.Api.Models;

namespace WorkDex.Api.Services;

// Ishchilik (ish haqi) smetasini Excel orqali loyihalarga qo'shish — "Ishchilik_UA" varag'i tuzilishida:
// A = ish turi (bo'lim), B = ish nomi, keyin har bir loyiha uchun 3 ustunli blok:
// Ish (dona / m / m2) | Narx | Ishchilik (summa). Loyiha nomi blok ustida, 1-qatorda.
// Har bir ish turi uchun o'sha nomli usta (topiladi yoki yaratiladi); summa to'liq to'langan deb yoziladi.
public partial class WorkerService
{
    public const int MaxJobImportRows = 2000;
    private const int MaxJobImportBlocks = 300;
    private const int JobColSection = 1, JobColName = 2, JobColQty = 3;
    private const int JobBlockWidth = 3;
    private const int JobDescriptionMaxLength = 500;
    private const string JobNumberFormat = "_-* #,##0_-;\\-* #,##0_-;_-* \"-\"??_-;_-@_-";
    private static readonly XLColor JobHeaderFill = XLColor.FromHtml("#172B4D");
    private static readonly XLColor JobSectionFill = XLColor.FromHtml("#DDEBF1");

    private static readonly Regex JobSheetPattern = new(@"ishchilik|ish haqi|работ", RegexOptions.IgnoreCase | RegexOptions.Compiled);
    private static readonly Regex JobQtyHeaderPattern = new(@"^(ish\b|miqdor|кол)", RegexOptions.IgnoreCase | RegexOptions.Compiled);
    private static readonly Regex JobTotalRowPattern = new(@"^(umumiy|jami|итого|всего|total)", RegexOptions.IgnoreCase | RegexOptions.Compiled);
    private static readonly Regex StageSuffixPattern = new(@"\s*[-–—]\s*(I{1,3}|IV|V|\d+)\s*$", RegexOptions.IgnoreCase | RegexOptions.Compiled);

    // "Ishchilik_UA" dagi ish turlari va ishlar (shablon uchun).
    private static readonly (string Section, string[] Jobs)[] DefaultJobSections =
    {
        ("Suvoq", new[] { "Suvoq qilish" }),
        ("Elektrika - I", new[] { "Tochka", "Shift Yigish", "Kabel tashlash" }),
        ("Santexnika - I", new[]
        {
            "Tochka", "tyopliy pol", "Radiator", "Instalatsiya", "Penoplex", "Sprink o'zgartirish",
            "Drenaj Konditsioner uchun", "Otopleniya kirish suvi", "Miksher + Teploobmennik", "Demontaj",
            "Basseyn", "Turba tashash", "Poliv",
        }),
        ("Stayashka", new[] { "Pol Stayashka" }),
        ("Gipsakarton", new[] { "Gipskarton patalok" }),
        ("Malyarka", new[] { "Malyarka qilish" }),
        ("Lepka", new[] { "Lepka (devor tyagalar)" }),
        ("Kafel", new[] { "Kafel terish yuzasi", "Kafel terish (Burchak)", "Gidro Izolatsiya", "Dush kabina" }),
        ("Laminat", new[] { "Laminat", "Nalivnoy pol" }),
        ("Eshik Ornatish", new[] { "Eshik Ornatish" }),
        ("Plintus Ornatish", new[] { "Pilintus Ornatish" }),
        ("Elektrika - II", new[] { "Razatka va Vklyuchatel ornatish", "Lyustra ornatish", "Gologen ornatish", "Vitishka ornatish", "Podsvetka ornatish" }),
        ("Santexnika - II", new[] { "Radiator qayta taqish", "Instalatsiya", "Vanna o'rnatish", "Smestitel o'rnatish" }),
        ("Tozalash", new[] { "Tozolash ishlari" }),
    };

    private sealed record JobBlock(int QtyCol, string? Label);

    // ---------- Shablon ----------

    public async Task<byte[]> BuildJobImportTemplateAsync(Guid requestingUserId)
    {
        var companyAdminId = await ResolveJobCompanyAsync(requestingUserId);
        var projects = await CompanyProjects(companyAdminId).OrderBy(p => p.CreatedAt).ToListAsync();
        if (projects.Count == 0)
            throw new ArgumentException("Hali birorta ham loyiha yo'q.");
        if (projects.Count > MaxJobImportBlocks)
            throw new ArgumentException($"Bir shablonda ko'pi bilan {MaxJobImportBlocks} ta loyiha bo'lishi mumkin.");

        int QtyColOf(int i) => JobColQty + i * JobBlockWidth;
        var lastCol = QtyColOf(projects.Count - 1) + 2;
        static string Col(int c) => XLHelper.GetColumnLetterFromNumber(c);

        using var workbook = new XLWorkbook();
        var ws = workbook.Worksheets.Add("Ishchilik");

        ws.Range(1, JobColSection, 2, JobColSection).Merge().Value = "Ish turi";
        ws.Range(1, JobColName, 2, JobColName).Merge().Value = "Ish nomi";
        StyleJobHeader(ws.Range(1, JobColSection, 2, JobColName));
        ws.Column(JobColSection).Width = 18;
        ws.Column(JobColName).Width = 36;

        for (var i = 0; i < projects.Count; i++)
        {
            var q = QtyColOf(i);
            ws.Range(1, q, 1, q + 2).Merge().Value = projects[i].Name;
            ws.Cell(2, q).Value = "Ish (dona / m / m2)";
            ws.Cell(2, q + 1).Value = "Narx";
            ws.Cell(2, q + 2).Value = "Ishchilik";
            StyleJobHeader(ws.Range(1, q, 2, q + 2));
            ws.Column(q).Width = 11;
            ws.Column(q + 1).Width = 12;
            ws.Column(q + 2).Width = 15;
        }
        ws.Row(1).Height = 30;
        ws.Row(2).Height = 30;
        ws.SheetView.Freeze(2, JobColName);

        var row = 3;
        foreach (var (section, jobs) in DefaultJobSections)
        {
            ws.Cell(row, JobColSection).Value = section;
            var head = ws.Range(row, JobColSection, row, lastCol);
            head.Style.Font.Bold = true;
            head.Style.Fill.BackgroundColor = JobSectionFill;
            row++;

            var first = row;
            foreach (var job in jobs)
            {
                ws.Cell(row, JobColName).Value = job;
                for (var i = 0; i < projects.Count; i++)
                {
                    string qty = $"{Col(QtyColOf(i))}{row}", price = $"{Col(QtyColOf(i) + 1)}{row}";
                    ws.Cell(row, QtyColOf(i) + 2).FormulaA1 = $"IF(AND({qty}<>\"\",{price}<>\"\"),{qty}*{price},\"\")";
                }
                row++;
            }
            var last = row - 1;
            var body = ws.Range(first, JobColSection, last, lastCol);
            body.Style.Border.InsideBorder = XLBorderStyleValues.Hair;
            body.Style.Border.OutsideBorder = XLBorderStyleValues.Thin;
            for (var i = 0; i < projects.Count; i++)
                ws.Range(first, QtyColOf(i), last, QtyColOf(i) + 2).Style.NumberFormat.Format = JobNumberFormat;

            ws.Cell(row, JobColSection).Value = "Umumiy Summa";
            for (var i = 0; i < projects.Count; i++)
            {
                var t = QtyColOf(i) + 2;
                ws.Cell(row, t).FormulaA1 = $"SUM({Col(t)}{first}:{Col(t)}{last})";
                ws.Cell(row, t).Style.NumberFormat.Format = JobNumberFormat;
            }
            ws.Range(row, JobColSection, row, lastCol).Style.Font.Bold = true;
            row += 2;
        }

        var help = workbook.Worksheets.Add("Yo'riqnoma");
        var lines = new List<string>
        {
            "Loyihalarga ishchilik (usta ish haqi) xarajatlarini bitta Excel fayl orqali qo'shish",
            "",
            "1. \"Ishchilik\" varag'ida: A — ish turi (bo'lim), B — ish nomi. Har bir loyiha — 1-qatorda nomi yozilgan blok:",
            "   Ish (dona / m / m2) — bajarilgan hajm, Narx — bir birlik narxi, Ishchilik — jami summa (avtomatik: hajm × narx).",
            "2. Ishchilik katagiga summani to'g'ridan-to'g'ri yozsangiz ham bo'ladi — u hajm × narxdan ustun turadi.",
            "   Ishchilik bo'sh yoki 0 bo'lsa, o'sha katak o'tkazib yuboriladi.",
            "3. Ko'k qatorlar — ish turlari. Har bir ish turi uchun shu nomli usta bog'lanadi (bo'lmasa — yaratiladi):",
            "   \"Elektrika - I\" va \"Elektrika - II\" — bitta \"Elektrika\" ustasi. Keyin ustalar sahifasida haqiqiy ism bilan o'zgartirish mumkin.",
            "4. Summalar so'mda (UZS) va to'liq to'langan deb yoziladi (kelishilgan = bajarilgan = to'langan) — loyiha xarajatida ko'rinadi.",
            "5. \"Umumiy Summa\" qatorlari o'qilmaydi. O'z ish turingiz yoki ishingiz uchun qator qo'shishingiz mumkin.",
            "6. Mavjud \"Ishchilik_UA\" faylingizni to'g'ridan-to'g'ri yuklash mumkin: nomida \"Ishchilik\" bo'lgan varaq o'qiladi.",
            "   Loyihalar 1-qatordagi nom bo'yicha topiladi (bo'shliq va tirelar hisobga olinmaydi). Tizimda yo'q loyiha ustunida summa bo'lsa — xato.",
            "7. Yuklashdan oldin natija ko'rsatiladi: bitta xato bo'lsa ham hech narsa saqlanmaydi.",
            "",
            "Tizimdagi loyihalar:",
        };
        lines.AddRange(projects.Select(p => "   • " + p.Name));
        for (var i = 0; i < lines.Count; i++) help.Cell(i + 1, 1).Value = lines[i];
        help.Cell(1, 1).Style.Font.Bold = true;
        help.Cell(1, 1).Style.Font.FontSize = 13;
        help.Column(1).Width = 120;

        ws.SetTabActive();
        using var stream = new MemoryStream();
        workbook.SaveAs(stream);
        return stream.ToArray();
    }

    private static void StyleJobHeader(IXLRange header)
    {
        header.Style.Font.Bold = true;
        header.Style.Font.FontColor = XLColor.White;
        header.Style.Fill.BackgroundColor = JobHeaderFill;
        header.Style.Alignment.Horizontal = XLAlignmentHorizontalValues.Center;
        header.Style.Alignment.Vertical = XLAlignmentVerticalValues.Center;
        header.Style.Alignment.WrapText = true;
        header.Style.Border.InsideBorder = XLBorderStyleValues.Thin;
        header.Style.Border.OutsideBorder = XLBorderStyleValues.Thin;
    }

    // ---------- Import ----------

    public async Task<WorkerJobImportResultDto> ImportJobsAsync(Stream excelStream, Guid createdByUserId, bool dryRun, DateTime? paymentDate = null)
    {
        var companyAdminId = await ResolveJobCompanyAsync(createdByUserId);

        var today = DateTime.SpecifyKind(DateTime.UtcNow.Date, DateTimeKind.Utc);
        var date = paymentDate.HasValue ? DateTime.SpecifyKind(paymentDate.Value.Date, DateTimeKind.Utc) : today;
        if (date > today.AddDays(1))
            throw new ArgumentException("To'lov sanasi kelajakda bo'lishi mumkin emas.");

        XLWorkbook workbook;
        try
        {
            workbook = new XLWorkbook(excelStream);
        }
        catch (Exception)
        {
            throw new ArgumentException("Faylni o'qib bo'lmadi. Iltimos, .xlsx formatidagi shablondan foydalaning.");
        }

        using (workbook)
        {
            var visible = workbook.Worksheets.Where(w => w.Visibility == XLWorksheetVisibility.Visible).ToList();
            var ws = visible.FirstOrDefault(w => JobSheetPattern.IsMatch(w.Name))
                ?? visible.FirstOrDefault()
                ?? throw new ArgumentException("Faylda varaq topilmadi.");

            var lastRow = ws.LastRowUsed()?.RowNumber() ?? 0;
            var (blocks, firstRow) = DetectJobLayout(ws, lastRow);
            if (blocks.Count == 0)
                throw new ArgumentException("Sarlavha topilmadi: 2-qatorda \"Ish (dona / m / m2)\", \"Narx\", \"Ishchilik\" ustunlari bo'lishi kerak.");
            if (blocks.Count > MaxJobImportBlocks)
                throw new ArgumentException($"Faylda juda ko'p loyiha ustuni bor (ko'pi bilan {MaxJobImportBlocks} ta).");
            if (lastRow - firstRow + 1 > MaxJobImportRows)
                throw new ArgumentException($"Faylda juda ko'p qator bor (ko'pi bilan {MaxJobImportRows} ta).");

            var byKey = (await CompanyProjects(companyAdminId).ToListAsync())
                .GroupBy(p => ProjectKey(p.Name))
                .Where(g => g.Key.Length > 0)
                .ToDictionary(g => g.Key, g => g.ToList());
            var ambiguous = blocks
                .Where(b => byKey.TryGetValue(ProjectKey(b.Label), out var list) && list.Count > 1)
                .Select(b => b.Label!).Distinct().ToList();
            if (ambiguous.Count > 0)
                throw new ArgumentException($"Tizimda bir xil nomli bir nechta loyiha bor: {string.Join(", ", ambiguous)}. Loyihalarni qayta nomlang.");
            var targets = blocks
                .Select(b => (Block: b, Project: byKey.TryGetValue(ProjectKey(b.Label), out var list) ? list[0] : null))
                .ToList();

            var workers = (await _context.Workers.Where(w => w.CompanyAdminId == companyAdminId).ToListAsync())
                .GroupBy(w => TextKey(w.FullName))
                .ToDictionary(g => g.Key, g => g.OrderBy(w => w.CreatedAt).First());
            var newWorkers = new Dictionary<string, Worker>();

            var rate = await Money.CurrentRateAsync(_currencyService);
            var now = DateTime.UtcNow;
            var result = new WorkerJobImportResultDto { DryRun = dryRun, ExchangeRate = rate };
            var jobs = new List<WorkerPayment>();
            var unknownWithData = new Dictionary<JobBlock, int>();
            var noAmount = new List<string>();
            string? section = null;

            for (var row = firstRow; row <= lastRow; row++)
            {
                var sectionText = CleanText(ws.Cell(row, JobColSection).GetFormattedString());
                var jobName = CleanText(ws.Cell(row, JobColName).GetFormattedString());

                if (sectionText is not null)
                {
                    if (JobTotalRowPattern.IsMatch(sectionText)) continue;
                    section = sectionText;
                }
                if (jobName is null) continue;
                var currentSection = section ?? "Boshqa ishlar";

                Worker? worker = null;
                var workerIsNew = false;

                foreach (var (block, project) in targets)
                {
                    var qtyCell = ws.Cell(row, block.QtyCol);
                    var priceCell = ws.Cell(row, block.QtyCol + 1);
                    var totalCell = ws.Cell(row, block.QtyCol + 2);
                    var qty = ReadNumber(qtyCell);
                    var price = ReadNumber(priceCell);
                    var total = ReadNumber(totalCell);

                    // "Ishchilik" katagidagi summa asosiy; bo'lmasa — hajm × narx.
                    var amount = total is > 0 ? total.Value
                        : qty is > 0 && price is > 0 ? qty.Value * price.Value
                        : 0m;
                    amount = Math.Round(amount, 2);

                    if (total is < 0)
                    {
                        result.Errors.Add(new WorkerJobImportIssueDto { Row = row, Name = jobName, Message = $"[{project?.Name ?? block.Label}] Summa manfiy bo'lishi mumkin emas." });
                        continue;
                    }
                    if (amount <= 0)
                    {
                        if (qty is > 0 && project is not null) noAmount.Add($"{project.Name}: {jobName} ({row}-qator)");
                        continue;
                    }
                    if (project is null)
                    {
                        unknownWithData.TryAdd(block, row);
                        continue;
                    }

                    if (worker is null)
                    {
                        var workerName = WorkerNameFor(currentSection);
                        var key = TextKey(workerName);
                        if (!workers.TryGetValue(key, out worker) && !newWorkers.TryGetValue(key, out worker))
                        {
                            worker = new Worker
                            {
                                FullName = workerName,
                                PhoneNumber = string.Empty,
                                Specialty = workerName,
                                Notes = "Excel (ishchilik) importida yaratildi",
                                CompanyAdminId = companyAdminId,
                                CreatedAt = now
                            };
                            newWorkers[key] = worker;
                        }
                        workerIsNew = newWorkers.ContainsKey(key);
                    }

                    var description = qty is > 0 && price is > 0
                        ? $"{jobName} — {FormatNumber(qty.Value)} × {FormatNumber(price.Value)}"
                        : jobName;
                    if (description.Length > JobDescriptionMaxLength) description = description[..JobDescriptionMaxLength];

                    var priceNote = !IsBlankCell(priceCell) && price is null ? CleanText(priceCell.GetFormattedString()) : null;
                    jobs.Add(new WorkerPayment
                    {
                        ProjectId = project.Id,
                        WorkerId = worker.Id,
                        Worker = worker,
                        JobDescription = description,
                        AgreedAmount = amount,
                        WorkAmount = amount,
                        PaidAmount = amount,
                        Currency = "UZS",
                        ExchangeRateToUzs = rate,
                        OriginalAgreedAmount = amount,
                        PaymentDate = date,
                        Notes = priceNote is null ? $"Excel importi · {currentSection}" : $"Excel importi · {currentSection} · {priceNote}",
                        CreatedByUserId = createdByUserId,
                        CreatedAt = now
                    });
                    result.Rows.Add(new WorkerJobImportRowDto
                    {
                        Row = row,
                        ProjectId = project.Id,
                        ProjectName = project.Name,
                        Section = currentSection,
                        JobName = jobName,
                        WorkerName = worker.FullName,
                        IsNewWorker = workerIsNew,
                        Quantity = qty is > 0 ? qty : null,
                        UnitPrice = price is > 0 ? price : null,
                        AmountUzs = amount
                    });
                }
            }

            foreach (var (block, row) in unknownWithData)
            {
                var col = XLHelper.GetColumnLetterFromNumber(block.QtyCol);
                result.Errors.Add(new WorkerJobImportIssueDto
                {
                    Row = row,
                    Name = block.Label ?? $"{col} ustuni",
                    Message = block.Label is null
                        ? $"{col} ustuni ustida loyiha nomi yozilmagan."
                        : $"«{block.Label}» nomli loyiha tizimda topilmadi ({col} ustun). Loyihani yarating, nomini to'g'rilang yoki ustunni o'chiring."
                });
            }
            foreach (var group in targets.Where(t => t.Project is not null).GroupBy(t => t.Project!.Id).Where(g => g.Count() > 1))
                result.Warnings.Add($"«{group.First().Project!.Name}» loyihasi faylda {group.Count()} marta uchraydi — hammasi qo'shiladi.");
            if (noAmount.Count > 0)
                result.Warnings.Add($"{noAmount.Count} ta ishning hajmi bor, lekin summasi yo'q — o'tkazib yuborildi: {string.Join("; ", noAmount.Take(10))}{(noAmount.Count > 10 ? " ..." : "")}");

            if (jobs.Count == 0 && result.Errors.Count == 0)
                throw new ArgumentException("Faylda summasi to'ldirilgan birorta ham ish topilmadi.");

            result.TotalUzs = jobs.Sum(j => j.AgreedAmount);
            result.TotalUsd = rate > 0 ? Math.Round(result.TotalUzs / rate, 2) : 0;
            result.NewWorkers = newWorkers.Values.Select(w => w.FullName).ToList();
            result.Projects = result.Rows
                .GroupBy(r => (r.ProjectId, r.ProjectName))
                .Select(g => new WorkerJobImportProjectDto { ProjectId = g.Key.ProjectId, ProjectName = g.Key.ProjectName, Count = g.Count(), AmountUzs = g.Sum(r => r.AmountUzs) })
                .ToList();

            if (dryRun || result.Errors.Count > 0)
                return result;

            _context.Workers.AddRange(newWorkers.Values);
            _context.WorkerPayments.AddRange(jobs);
            await _context.SaveChangesAsync();
            result.Created = jobs.Count;
            return result;
        }
    }

    private static (List<JobBlock> Blocks, int FirstDataRow) DetectJobLayout(IXLWorksheet ws, int lastRow)
    {
        var lastCol = Math.Max(ws.LastColumnUsed()?.ColumnNumber() ?? JobColQty, JobColQty);
        for (var r = 1; r <= Math.Min(lastRow, 10); r++)
        {
            var blocks = new List<JobBlock>();
            for (var c = JobColQty; c <= lastCol; c++)
            {
                if (!JobQtyHeaderPattern.IsMatch(ws.Cell(r, c).GetFormattedString().Trim())) continue;
                string? label = null;
                if (r > 1)
                {
                    var labelCell = ws.Cell(r - 1, c);
                    if (labelCell.IsMerged()) labelCell = labelCell.MergedRange().FirstCell();
                    label = CleanText(labelCell.GetFormattedString());
                }
                blocks.Add(new JobBlock(c, label));
            }
            if (blocks.Count > 0) return (blocks, r + 1);
        }
        return (new List<JobBlock>(), 3);
    }

    private async Task<Guid> ResolveJobCompanyAsync(Guid userId)
    {
        var user = await _context.Users.FindAsync(userId)
            ?? throw new KeyNotFoundException("Foydalanuvchi topilmadi.");
        return user.CompanyAdminId ?? userId;
    }

    private IQueryable<Project> CompanyProjects(Guid companyAdminId) =>
        _context.Projects.Where(p =>
            p.CompanyAdminId == companyAdminId ||
            p.CreatedByUserId == companyAdminId ||
            (p.CreatedByUser != null && p.CreatedByUser.CompanyAdminId == companyAdminId));

    // "Elektrika - I" va "Elektrika - II" → "Elektrika".
    private static string WorkerNameFor(string section)
    {
        var name = StageSuffixPattern.Replace(section, "").Trim();
        return name.Length == 0 ? section : name;
    }

    private static string FormatNumber(decimal value) =>
        value.ToString("#,0.##", CultureInfo.InvariantCulture).Replace(",", " ");

    private static string? CleanText(string? value)
    {
        if (string.IsNullOrWhiteSpace(value)) return null;
        return string.Join(' ', value.Split((char[]?)null, StringSplitOptions.RemoveEmptyEntries));
    }

    private static string TextKey(string? value)
    {
        var cleaned = CleanText(value);
        if (cleaned is null) return string.Empty;
        var decomposed = cleaned.ToLowerInvariant().Normalize(NormalizationForm.FormD);
        var sb = new StringBuilder(decomposed.Length);
        foreach (var ch in decomposed)
        {
            if (CharUnicodeInfo.GetUnicodeCategory(ch) == UnicodeCategory.NonSpacingMark) continue;
            sb.Append(ch is '‘' or '’' or 'ʻ' or 'ʼ' or '`' ? '\'' : ch);
        }
        return sb.ToString();
    }

    private static string ProjectKey(string? name) => new(TextKey(name).Where(char.IsLetterOrDigit).ToArray());

    private static bool IsBlankCell(IXLCell cell)
    {
        var v = cell.Value;
        return v.IsBlank || (v.IsText && string.IsNullOrWhiteSpace(v.GetText()));
    }

    private static decimal? ReadNumber(IXLCell cell)
    {
        var value = cell.Value;
        if (value.IsNumber) return (decimal)value.GetNumber();
        if (!value.IsText) return null;
        var text = value.GetText()
            .Replace(" ", "").Replace(" ", "").Replace(" ", "")
            .Replace("so'm", "", StringComparison.OrdinalIgnoreCase);
        if (text.Contains(',') && text.Contains('.')) text = text.Replace(",", "");
        else if (text.Count(c => c == ',') == 1) text = text.Replace(',', '.');
        else text = text.Replace(",", "");
        return decimal.TryParse(text, NumberStyles.Number, CultureInfo.InvariantCulture, out var d) ? d : null;
    }
}

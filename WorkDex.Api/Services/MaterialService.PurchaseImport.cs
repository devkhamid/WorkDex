using System.Globalization;
using System.Text.RegularExpressions;
using ClosedXML.Excel;
using Microsoft.EntityFrameworkCore;
using WorkDex.Api.DTOs.Materials;
using WorkDex.Api.Models;

namespace WorkDex.Api.Services;

public partial class MaterialService
{
    public const int MaxPurchaseImportRows = 2000;

    // Smeta ko'rinishi ("Materiallar_UA" kabi): A = nomi, B = ед.изм., keyin har bir loyiha uchun
    // 4 ustunli blok: кол-во | цена за ед. | всего мат | (bo'sh). Loyiha nomi blok ustida, 1-qatorda.
    private const int ColName = 1, ColUnit = 2, ColQty = 3, ColPrice = 4;
    private const int BlockWidth = 4;
    private const int MaxPurchaseImportBlocks = 300;
    private const string NumberFormat = "_-* #,##0.0_-;\\-* #,##0.0_-;_-* \"-\"??_-;_-@_-";
    private static readonly XLColor HeaderFill = XLColor.FromHtml("#172B4D");
    private static readonly XLColor SectionFill = XLColor.FromHtml("#DDEBF1");

    // Standart ro'yxatda bo'limi bo'lmagan kategoriyalar uchun bo'lim nomlari.
    private static readonly Dictionary<string, string> SectionTitles = new()
    {
        ["Qora ishlar"] = "Qora ishlar",
        ["Elektr"] = "Elektr ishlari",
        ["Santexnika"] = "Santexnika ishlari",
        ["Bo'yoq va suvoq"] = "Suvoq va bo'yoq ishlari",
        ["Gipsokarton"] = "Gipsokarton ishlari",
        ["Plitka"] = "Kafel-plitka ishlari",
        ["Pol qoplamasi"] = "Pol qoplamasi",
        ["Eshik va deraza"] = "Eshik va derazalar",
        ["Isitish va ventilyatsiya"] = "Isitish va ventilyatsiya",
        ["Boshqa"] = "Boshqa materiallar",
    };

    private static readonly (string Category, string[] Keywords)[] SectionKeywords =
    {
        ("Gipsokarton", new[] { "гипсокартон", "гкл", "потол", "gipsokarton", "shift" }),
        ("Santexnika", new[] { "сантех", "santex", "santeh", "водопровод", "канализ" }),
        ("Isitish va ventilyatsiya", new[] { "отоплен", "вентиляц", "кондиц", "радиатор", "isitish", "ventilyats", "konditsioner" }),
        ("Elektr", new[] { "электр", "освещ", "свет", "elektr", "yoritish" }),
        ("Bo'yoq va suvoq", new[] { "штукат", "маляр", "покраск", "шпакл", "bo'yoq", "boyoq", "suvoq", "malyar" }),
        ("Plitka", new[] { "облицов", "плитк", "кафел", "plitka", "kafel" }),
        ("Pol qoplamasi", new[] { "напольн", "ламинат", "паркет", "линолеум", "пола", "пол ", "laminat", "parket", "pol " }),
        ("Eshik va deraza", new[] { "двер", "окн", "окон", "eshik", "deraza" }),
        ("Qora ishlar", new[] { "чернов", "демонтаж", "стяжк", "кладк", "qora ish" }),
        ("Boshqa", new[] { "прочее", "прочие", "разное", "boshqa" }),
    };

    private static readonly Regex TotalRowPattern = new(@"^(итого|всего|jami|total)", RegexOptions.IgnoreCase | RegexOptions.Compiled);
    private static readonly Regex HeaderQtyPattern = new(@"кол|miqdor|qty|soni", RegexOptions.IgnoreCase | RegexOptions.Compiled);
    private static readonly Regex BrandSuffixPattern = new(@"^(?<name>.+?)\s*\[(?<brand>[^\[\]]+)\]\s*$", RegexOptions.Compiled);
    private static readonly Regex MaterialSheetPattern = new(@"materi|матер", RegexOptions.IgnoreCase | RegexOptions.Compiled);

    private sealed record PurchaseBlock(int QtyCol, int PriceCol, string? Label);

    private static string SectionToCategory(string section)
    {
        if (DefaultSectionCategories.TryGetValue(MatchKey(section), out var known)) return known;
        var normalized = NormalizeCategory(section);
        if (normalized is not null && StandardCategories.Contains(normalized)) return normalized;

        var key = " " + MatchKey(section) + " ";
        foreach (var (category, keywords) in SectionKeywords)
            if (keywords.Any(k => key.Contains(k)))
                return category;
        return normalized ?? section;
    }

    private static (string Name, string? Brand) SplitBrand(string name)
    {
        var m = BrandSuffixPattern.Match(name);
        return m.Success ? (Clean(m.Groups["name"].Value)!, Clean(m.Groups["brand"].Value)) : (name, null);
    }

    // "H -2-5" = "H-2-5", 'Bomi "EGIS"' = "Bomi EGIS": faqat harf va raqamlar solishtiriladi.
    private static string ProjectKey(string? name) =>
        new(MatchKey(name).Where(char.IsLetterOrDigit).ToArray());

    private static string Col(int column) => XLHelper.GetColumnLetterFromNumber(column);

    // ---------- Shablon ----------

    public async Task<byte[]> BuildPurchaseImportTemplateAsync(Guid projectId, Guid requestingUserId)
    {
        var (project, companyAdminId) = await ResolvePurchaseContextAsync(projectId, requestingUserId);
        return await BuildPurchaseTemplateAsync(new[] { project }, companyAdminId);
    }

    public async Task<byte[]> BuildMultiProjectPurchaseTemplateAsync(Guid requestingUserId, IReadOnlyCollection<Guid>? projectIds = null)
    {
        var companyAdminId = await ResolveCompanyAdminIdAsync(requestingUserId);
        var query = CompanyProjectsQuery(companyAdminId);
        if (projectIds is { Count: > 0 })
            query = query.Where(p => projectIds.Contains(p.Id));
        var projects = await query.OrderBy(p => p.CreatedAt).ToListAsync();
        if (projects.Count == 0)
            throw new ArgumentException("Shablon uchun birorta ham loyiha topilmadi.");
        if (projects.Count > MaxPurchaseImportBlocks)
            throw new ArgumentException($"Bir shablonda ko'pi bilan {MaxPurchaseImportBlocks} ta loyiha bo'lishi mumkin.");
        return await BuildPurchaseTemplateAsync(projects, companyAdminId);
    }

    private async Task<byte[]> BuildPurchaseTemplateAsync(IReadOnlyList<Project> projects, Guid companyAdminId)
    {
        var catalog = await _context.Materials
            .AsNoTracking()
            .Where(m => m.CompanyAdminId == companyAdminId)
            .OrderBy(m => m.Name).ThenBy(m => m.Brand)
            .ToListAsync();

        var multi = projects.Count > 1;
        int QtyColOf(int i) => ColQty + i * BlockWidth;
        var lastCol = QtyColOf(projects.Count - 1) + 2;

        using var workbook = new XLWorkbook();
        var ws = workbook.Worksheets.Add("Materiallar");

        ws.Range(1, ColName, 2, ColName).Merge().Value = "Material nomi";
        ws.Range(1, ColUnit, 2, ColUnit).Merge().Value = "O'lchov birligi";
        StyleHeader(ws.Range(1, ColName, 2, ColUnit));
        ws.Column(ColName).Width = 53;
        ws.Column(ColUnit).Width = 9;

        for (var i = 0; i < projects.Count; i++)
        {
            var q = QtyColOf(i);
            ws.Range(1, q, 1, q + 2).Merge().Value = projects[i].Name;
            ws.Cell(2, q).Value = "Miqdori";
            ws.Cell(2, q + 1).Value = "Narxi (so'm)";
            ws.Cell(2, q + 2).Value = "Jami";
            StyleHeader(ws.Range(1, q, 2, q + 2));
            ws.Column(q).Width = 10;
            ws.Column(q + 1).Width = 14;
            ws.Column(q + 2).Width = 16;
            if (i < projects.Count - 1) ws.Column(q + 3).Width = 2;
        }
        ws.Row(1).Height = 30;
        ws.Row(2).Height = 30;
        ws.SheetView.Freeze(2, multi ? ColUnit : 0);

        var row = 3;
        void Section(string title)
        {
            ws.Cell(row, ColName).Value = title;
            var range = ws.Range(row, ColName, row, lastCol);
            range.Style.Font.Bold = true;
            range.Style.Fill.BackgroundColor = SectionFill;
            row++;
        }
        void Item(string? name, string? unit)
        {
            if (name is not null)
            {
                ws.Cell(row, ColName).Value = name;
                ws.Cell(row, ColUnit).Value = unit;
            }
            for (var i = 0; i < projects.Count; i++)
            {
                var qty = $"{Col(QtyColOf(i))}{row}";
                var price = $"{Col(QtyColOf(i) + 1)}{row}";
                ws.Cell(row, QtyColOf(i) + 2).FormulaA1 = $"IF(AND({qty}<>\"\",{price}<>\"\"),{qty}*{price},\"\")";
            }
            row++;
        }

        // Faqat "Materiallar_UA" smetasidagi ro'yxat, o'sha tartib va bo'limlarda — boshqa material qo'shilmaydi.
        // Katalogda shu material boshqa birlikda saqlangan bo'lsa — katalogdagi birligi yoziladi (import xato bermasligi uchun).
        var catalogByKey = catalog
            .Where(m => m.Brand is null)
            .GroupBy(m => MatchKey(m.Name))
            .ToDictionary(g => g.Key, g => g.First());
        Material? FindInCatalog(DefaultMaterial d) =>
            catalogByKey.TryGetValue(MatchKey(d.Name), out var m) || catalogByKey.TryGetValue(MatchKey(d.Russian), out m) ? m : null;

        foreach (var section in DefaultPurchaseSections)
        {
            Section(section.Title);
            foreach (var d in section.Items)
                Item(d.Name, FindInCatalog(d)?.Unit ?? d.Unit);
        }

        var lastItemRow = row - 1;
        void Grid(IXLRange range)
        {
            range.Style.Border.InsideBorder = XLBorderStyleValues.Hair;
            range.Style.Border.OutsideBorder = XLBorderStyleValues.Thin;
        }
        Grid(ws.Range(3, ColName, lastItemRow, ColUnit));
        for (var i = 0; i < projects.Count; i++)
        {
            var block = ws.Range(3, QtyColOf(i), lastItemRow, QtyColOf(i) + 2);
            block.Style.NumberFormat.Format = NumberFormat;
            Grid(block);
        }

        row++;
        ws.Cell(row, ColName).Value = "Jami materiallar";
        for (var i = 0; i < projects.Count; i++)
        {
            var t = QtyColOf(i) + 2;
            ws.Cell(row, t).FormulaA1 = $"SUM({Col(t)}3:{Col(t)}{lastItemRow})";
            ws.Cell(row, t).Style.NumberFormat.Format = NumberFormat;
        }
        var totalRange = ws.Range(row, ColName, row, lastCol);
        totalRange.Style.Font.Bold = true;
        totalRange.Style.Fill.BackgroundColor = SectionFill;

        var help = workbook.Worksheets.Add("Yo'riqnoma");
        var lines = new List<string>
        {
            multi
                ? "Bir nechta loyihaga material xaridlarini bitta Excel fayl orqali qo'shish"
                : $"«{projects[0].Name}» loyihasiga material xaridlarini Excel orqali qo'shish",
            "",
            "1. \"Materiallar\" varag'ida har bir qatorga bitta material: nomi (A) va o'lchov birligi (B).",
            multi
                ? "2. Har bir loyiha — 1-qatorda nomi yozilgan alohida blok: Miqdori | Narxi (so'm) | Jami (avtomatik hisoblanadi)."
                : "2. Miqdori va Narxi (bir birlik uchun) ni yozing, Jami — avtomatik hisoblanadi.",
            multi
                ? "   Material qatorida faqat shu loyihada ishlatilgan miqdor va narxni yozing. Miqdori bo'sh yoki 0 kataklar o'tkazib yuboriladi."
                : "   Miqdori bo'sh yoki 0 bo'lgan qatorlar o'tkazib yuboriladi.",
            "3. Ko'k fonli qatorlar — bo'limlar (ish turi). Ularning ostidagi materiallar shu kategoriyaga kiradi.",
            "   O'z bo'limingizni qo'shishingiz mumkin: faqat A ustuniga nom yozing (masalan \"Yoritish montaji\").",
            "4. Materiallar ro'yxati \"Materiallar_UA\" smetasidagi kabi oldindan yozilgan. Kerak bo'lsa, o'zingiz qator qo'shib yangi material yozishingiz mumkin.",
            "   Brendni kvadrat qavsda yozish mumkin: \"Gipsokarton 12.5 [Knauf]\".",
            "5. Narxlar so'mda (UZS). Narx bo'sh qolsa — material faqat miqdori bo'yicha (narxsiz) qo'shiladi. Xarid sanasi yuklash oynasida tanlanadi.",
            "6. \"Jami materiallar\" qatoridan keyingi qatorlar o'qilmaydi.",
            "7. Yuklashdan oldin natija ko'rsatiladi: bitta katakda ham xato bo'lsa, hech narsa saqlanmaydi.",
        };
        if (multi)
        {
            lines.Add("");
            lines.Add("Mavjud smeta faylingiz (masalan \"Materiallar_UA\" varag'i) shu tuzilishda bo'lsa, uni to'g'ridan-to'g'ri yuklash mumkin:");
            lines.Add("   nomida \"Materi...\" bo'lgan varaq o'qiladi, loyihalar 1-qatordagi nom bo'yicha topiladi, ruscha material nomlari o'zbekchaga o'giriladi");
            lines.Add("   (bo'shliq, tire va tirnoqlar hisobga olinmaydi: \"H -2-5\" = \"H-2-5\").");
            lines.Add("   Tizimda yo'q loyiha ustunida ma'lumot bo'lsa — xato ko'rsatiladi: loyihani avval yarating yoki ustunni o'chiring.");
            lines.Add("   Loyiha ustunlarini o'chirish yoki tartibini o'zgartirish mumkin — faqat nomlar muhim.");
            lines.Add("");
            lines.Add("Tizimdagi loyihalar (1-qatordagi nom shularga mos bo'lishi kerak):");
            lines.AddRange(projects.Select(p => "   • " + p.Name));
        }
        for (var i = 0; i < lines.Count; i++) help.Cell(i + 1, 1).Value = lines[i];
        help.Cell(1, 1).Style.Font.Bold = true;
        help.Cell(1, 1).Style.Font.FontSize = 13;
        help.Column(1).Width = 110;

        ws.SetTabActive();
        using var stream = new MemoryStream();
        workbook.SaveAs(stream);
        return stream.ToArray();
    }

    private static void StyleHeader(IXLRange header)
    {
        header.Style.Font.Bold = true;
        header.Style.Font.FontColor = XLColor.White;
        header.Style.Fill.BackgroundColor = HeaderFill;
        header.Style.Alignment.Horizontal = XLAlignmentHorizontalValues.Center;
        header.Style.Alignment.Vertical = XLAlignmentVerticalValues.Center;
        header.Style.Alignment.WrapText = true;
        header.Style.Border.InsideBorder = XLBorderStyleValues.Thin;
        header.Style.Border.OutsideBorder = XLBorderStyleValues.Thin;
    }

    // ---------- Kontekst ----------

    private async Task<(Project Project, Guid CompanyAdminId)> ResolvePurchaseContextAsync(Guid projectId, Guid userId)
    {
        var project = await _context.Projects.FindAsync(projectId)
            ?? throw new KeyNotFoundException("Loyiha topilmadi.");
        var user = await _context.Users.FindAsync(userId)
            ?? throw new KeyNotFoundException("Foydalanuvchi topilmadi.");
        return (project, project.CompanyAdminId ?? user.CompanyAdminId ?? userId);
    }

    private async Task<Guid> ResolveCompanyAdminIdAsync(Guid userId)
    {
        var user = await _context.Users.FindAsync(userId)
            ?? throw new KeyNotFoundException("Foydalanuvchi topilmadi.");
        return user.CompanyAdminId ?? userId;
    }

    private IQueryable<Project> CompanyProjectsQuery(Guid companyAdminId) =>
        _context.Projects.Where(p =>
            p.CompanyAdminId == companyAdminId ||
            p.CreatedByUserId == companyAdminId ||
            (p.CreatedByUser != null && p.CreatedByUser.CompanyAdminId == companyAdminId));

    // ---------- Import ----------

    public async Task<MaterialPurchaseImportResultDto> ImportPurchasesAsync(
        Guid projectId, Stream excelStream, Guid createdByUserId, bool dryRun, DateTime? purchaseDate = null)
    {
        var (project, companyAdminId) = await ResolvePurchaseContextAsync(projectId, createdByUserId);
        return await ImportPurchasesCoreAsync(excelStream, companyAdminId, createdByUserId, dryRun, purchaseDate, blocks =>
        {
            // Bitta blok — nomidan qat'i nazar shu loyihaga. Umumiy smeta (bir nechta blok) bo'lsa — faqat nomi mos keladigan blok.
            if (blocks.Count == 1) return new() { (blocks[0], project) };
            var key = ProjectKey(project.Name);
            var matched = blocks.Where(b => ProjectKey(b.Label) == key).Select(b => (b, (Project?)project)).ToList();
            if (matched.Count == 0)
                throw new ArgumentException($"Faylda bir nechta loyiha ustuni bor, lekin «{project.Name}» nomli ustun topilmadi.");
            return matched;
        });
    }

    public async Task<MaterialPurchaseImportResultDto> ImportMultiProjectPurchasesAsync(
        Stream excelStream, Guid createdByUserId, bool dryRun, DateTime? purchaseDate = null)
    {
        var companyAdminId = await ResolveCompanyAdminIdAsync(createdByUserId);
        var byKey = (await CompanyProjectsQuery(companyAdminId).ToListAsync())
            .GroupBy(p => ProjectKey(p.Name))
            .Where(g => g.Key.Length > 0)
            .ToDictionary(g => g.Key, g => g.ToList());

        return await ImportPurchasesCoreAsync(excelStream, companyAdminId, createdByUserId, dryRun, purchaseDate, blocks =>
        {
            var ambiguous = blocks
                .Where(b => byKey.TryGetValue(ProjectKey(b.Label), out var list) && list.Count > 1)
                .Select(b => b.Label!)
                .Distinct()
                .ToList();
            if (ambiguous.Count > 0)
                throw new ArgumentException($"Tizimda bir xil nomli bir nechta loyiha bor: {string.Join(", ", ambiguous)}. Loyihalarni qayta nomlang.");
            return blocks
                .Select(b => (b, byKey.TryGetValue(ProjectKey(b.Label), out var list) ? list[0] : (Project?)null))
                .ToList();
        });
    }

    private static IXLWorksheet PickPurchaseSheet(XLWorkbook workbook)
    {
        var visible = workbook.Worksheets.Where(w => w.Visibility == XLWorksheetVisibility.Visible).ToList();
        return visible.FirstOrDefault(w => MaterialSheetPattern.IsMatch(w.Name))
            ?? visible.FirstOrDefault()
            ?? throw new ArgumentException("Faylda varaq topilmadi.");
    }

    // "кол-во" yozilgan sarlavha qatorini topadi: har bir shunday ustun — bitta loyiha bloki,
    // narx undan keyingi ustunda, loyiha nomi bir qator yuqorida (birlashtirilgan katak bo'lishi mumkin).
    private static (List<PurchaseBlock> Blocks, int FirstDataRow) DetectPurchaseLayout(IXLWorksheet ws, int lastRow)
    {
        var lastCol = Math.Max(ws.LastColumnUsed()?.ColumnNumber() ?? ColPrice, ColPrice);
        for (var r = 1; r <= Math.Min(lastRow, 10); r++)
        {
            var blocks = new List<PurchaseBlock>();
            for (var c = ColQty; c <= lastCol; c++)
            {
                if (!HeaderQtyPattern.IsMatch(ws.Cell(r, c).GetFormattedString())) continue;
                string? label = null;
                if (r > 1)
                {
                    var labelCell = ws.Cell(r - 1, c);
                    if (labelCell.IsMerged()) labelCell = labelCell.MergedRange().FirstCell();
                    label = Clean(labelCell.GetFormattedString());
                }
                blocks.Add(new PurchaseBlock(c, c + 1, label));
            }
            if (blocks.Count > 0) return (blocks, r + 1);
        }
        return (new List<PurchaseBlock> { new(ColQty, ColPrice, null) }, 3);
    }

    private async Task<MaterialPurchaseImportResultDto> ImportPurchasesCoreAsync(
        Stream excelStream, Guid companyAdminId, Guid createdByUserId, bool dryRun, DateTime? purchaseDate,
        Func<List<PurchaseBlock>, List<(PurchaseBlock Block, Project? Project)>> resolveBlocks)
    {
        var today = DateTime.SpecifyKind(DateTime.UtcNow.Date, DateTimeKind.Utc);
        var date = purchaseDate.HasValue ? DateTime.SpecifyKind(purchaseDate.Value.Date, DateTimeKind.Utc) : today;
        if (date > today.AddDays(1))
            throw new ArgumentException("Xarid sanasi kelajakda bo'lishi mumkin emas.");

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
            var ws = PickPurchaseSheet(workbook);
            var lastRow = ws.LastRowUsed()?.RowNumber() ?? 0;
            var (allBlocks, firstRow) = DetectPurchaseLayout(ws, lastRow);
            if (allBlocks.Count > MaxPurchaseImportBlocks)
                throw new ArgumentException($"Faylda juda ko'p loyiha ustuni bor (ko'pi bilan {MaxPurchaseImportBlocks} ta).");
            if (lastRow - firstRow + 1 > MaxPurchaseImportRows)
                throw new ArgumentException($"Faylda juda ko'p qator bor. Bir martada ko'pi bilan {MaxPurchaseImportRows} ta qator yuklash mumkin.");

            var targets = resolveBlocks(allBlocks);
            var multi = targets.Count > 1;
            string Prefix(PurchaseBlock b, Project p) => multi ? $"[{p.Name}] " : "";

            var catalog = (await _context.Materials
                    .Where(m => m.CompanyAdminId == companyAdminId)
                    .ToListAsync())
                .GroupBy(m => (MatchKey(m.Name), MatchKey(m.Brand)))
                .ToDictionary(g => g.Key, g => g.OrderBy(m => m.CreatedAt).First());

            var rate = await Money.CurrentRateAsync(_currencyService);
            var now = DateTime.UtcNow;

            var result = new MaterialPurchaseImportResultDto { DryRun = dryRun, ExchangeRate = rate };
            var newMaterials = new Dictionary<(string, string), Material>();
            var categoryUpdates = new Dictionary<Material, string>();
            var purchases = new List<MaterialPurchase>();
            var unknownWithData = new Dictionary<PurchaseBlock, int>();
            var withoutPrice = 0;
            string? currentCategory = null;

            for (var row = firstRow; row <= lastRow; row++)
            {
                var nameCell = ws.Cell(row, ColName);
                var rawName = Clean(nameCell.GetFormattedString());
                var unitRaw = Clean(ws.Cell(row, ColUnit).GetFormattedString());
                var cells = targets
                    .Select(t =>
                    {
                        var qtyCell = ws.Cell(row, t.Block.QtyCol);
                        var priceCell = ws.Cell(row, t.Block.PriceCol);
                        return (t.Block, t.Project, Qty: qtyCell, Price: priceCell,
                            QtyEmpty: IsBlankNumber(qtyCell), PriceEmpty: IsBlankNumber(priceCell));
                    })
                    .ToList();

                if (rawName is null)
                {
                    if (cells.Any(c => !c.QtyEmpty && (ReadDecimal(c.Qty) ?? 1) != 0))
                        result.Errors.Add(new MaterialImportIssueDto { Row = row, Message = "Material nomi kiritilmagan." });
                    continue;
                }

                if (TotalRowPattern.IsMatch(rawName))
                    break;

                if (unitRaw is null && cells.All(c => c.QtyEmpty && c.PriceEmpty))
                {
                    // Bo'sh qolgan standart material qatori (masalan "Стекло перегородка") bo'lim emas.
                    if (!nameCell.Value.IsNumber && FindDefaultMaterial(rawName) is null)
                        currentCategory = SectionToCategory(rawName);
                    continue;
                }

                var (name, brand) = SplitBrand(rawName);
                // Eski ruscha smetadagi nom ("Подъем материала") standart o'zbekcha nomga o'giriladi.
                var standard = brand is null ? FindDefaultMaterial(name) : null;
                if (standard is not null) name = standard.Name;
                Material? material = null;
                var isNew = false;
                var materialResolved = false;
                var materialFailed = false;

                foreach (var (block, project, qtyCell, priceCell, qtyEmpty, priceEmpty) in cells)
                {
                    var qty = qtyEmpty ? null : ReadDecimal(qtyCell);
                    var price = priceEmpty ? null : ReadDecimal(priceCell);
                    var qtyInvalid = !qtyEmpty && qty is null;
                    if (!qtyInvalid && (qty ?? 0) == 0)
                    {
                        result.SkippedEmpty++;
                        continue;
                    }

                    if (project is null)
                    {
                        unknownWithData.TryAdd(block, row);
                        continue;
                    }

                    result.TotalRows++;

                    // Material qator bo'yicha bir marta aniqlanadi (barcha loyihalar uchun umumiy).
                    if (!materialResolved)
                    {
                        materialResolved = true;
                        var materialErrors = new List<string>();
                        if (name.Length > NameMaxLength) materialErrors.Add($"nomi {NameMaxLength} belgidan oshmasligi kerak");
                        if (brand is { Length: > BrandMaxLength }) materialErrors.Add($"brend {BrandMaxLength} belgidan oshmasligi kerak");
                        if (unitRaw is { Length: > UnitMaxLength }) materialErrors.Add($"o'lchov birligi {UnitMaxLength} belgidan oshmasligi kerak");

                        if (materialErrors.Count == 0)
                        {
                            var key = (MatchKey(name), MatchKey(brand));
                            if (catalog.TryGetValue(key, out var existing)
                                || (standard is not null && catalog.TryGetValue((MatchKey(standard.Russian), ""), out existing))
                                || newMaterials.TryGetValue(key, out existing))
                            {
                                material = existing;
                                isNew = newMaterials.ContainsKey(key);
                                if (unitRaw is not null && MatchKey(CanonicalUnit(unitRaw)) != MatchKey(material.Unit))
                                    materialErrors.Add($"katalogda bu material \"{material.Unit}\" birligida, faylda \"{unitRaw}\" yozilgan");
                                else if (currentCategory is not null && material.Category is null && !isNew)
                                    categoryUpdates[material] = currentCategory;
                            }
                            else
                            {
                                material = new Material
                                {
                                    Name = name,
                                    Brand = brand,
                                    Unit = unitRaw is not null ? CanonicalUnit(unitRaw) : standard?.Unit ?? "dona",
                                    Category = currentCategory,
                                    CompanyAdminId = companyAdminId,
                                    CreatedAt = now
                                };
                                newMaterials[key] = material;
                                isNew = true;
                            }
                        }

                        if (materialErrors.Count > 0)
                        {
                            materialFailed = true;
                            AddPurchaseIssue(result, row, rawName, "", materialErrors);
                        }
                    }
                    if (materialFailed) continue;

                    var errors = new List<string>();
                    if (qty is null) errors.Add("miqdor (кол-во) kiritilmagan yoki noto'g'ri");
                    else
                    {
                        qty = Math.Round(qty.Value, 2);
                        if (qty < 0.01m) errors.Add("miqdor 0 dan katta bo'lishi kerak");
                    }
                    // Narx bo'sh yoki 0 — xato emas: material faqat miqdori bo'yicha (narxsiz) qo'shiladi.
                    if (priceEmpty) price = 0;
                    if (price is null) errors.Add("narx (цена за ед.) noto'g'ri yozilgan");
                    else
                    {
                        price = Math.Round(price.Value, 2);
                        if (price < 0) errors.Add("narx manfiy bo'lishi mumkin emas");
                    }
                    if (errors.Count > 0)
                    {
                        AddPurchaseIssue(result, row, rawName, Prefix(block, project), errors);
                        continue;
                    }

                    if (price == 0) withoutPrice++;
                    var total = Math.Round(qty!.Value * price!.Value, 2);
                    purchases.Add(new MaterialPurchase
                    {
                        ProjectId = project.Id,
                        MaterialId = material!.Id,
                        Material = material,
                        Quantity = qty.Value,
                        Unit = material.Unit,
                        UnitPrice = price.Value,
                        TotalCost = total,
                        Currency = "UZS",
                        ExchangeRateToUzs = rate,
                        OriginalUnitPrice = price.Value,
                        Brand = material.Brand,
                        PurchaseDate = date,
                        CreatedByUserId = createdByUserId,
                        CreatedAt = now
                    });
                    result.Rows.Add(new MaterialPurchaseImportRowDto
                    {
                        Row = row,
                        ProjectId = project.Id,
                        ProjectName = project.Name,
                        MaterialName = material.Name,
                        Brand = material.Brand,
                        Unit = material.Unit,
                        Category = currentCategory ?? material.Category,
                        Quantity = qty.Value,
                        UnitPrice = price.Value,
                        Currency = "UZS",
                        TotalCostUzs = total,
                        PurchaseDate = date,
                        IsNewMaterial = isNew
                    });
                }
            }

            foreach (var (block, row) in unknownWithData)
            {
                result.Errors.Add(new MaterialImportIssueDto
                {
                    Row = row,
                    Name = block.Label ?? $"{Col(block.QtyCol)} ustuni",
                    Message = block.Label is null
                        ? $"{Col(block.QtyCol)} ustuni ustida loyiha nomi yozilmagan."
                        : $"«{block.Label}» nomli loyiha tizimda topilmadi ({Col(block.QtyCol)} ustun). Loyihani yarating, nomini to'g'rilang yoki ustunni o'chiring."
                });
            }

            foreach (var group in targets.Where(t => t.Project is not null).GroupBy(t => t.Project!.Id).Where(g => g.Count() > 1))
            {
                var cols = string.Join(", ", group.Select(t => Col(t.Block.QtyCol)));
                result.Warnings.Add($"«{group.First().Project!.Name}» loyihasi faylda {group.Count()} marta uchraydi ({cols} ustunlar) — hammasi qo'shiladi.");
            }

            if (withoutPrice > 0)
                result.Warnings.Add($"{withoutPrice} ta materialning narxi ko'rsatilmagan — ular faqat miqdori bo'yicha (narxsiz) qo'shiladi.");

            if (result.TotalRows == 0 && result.Errors.Count == 0)
                throw new ArgumentException("Faylda miqdori va narxi to'ldirilgan birorta ham material topilmadi.");

            result.TotalCostUzs = purchases.Sum(p => p.TotalCost);
            result.TotalCostUsd = rate > 0 ? Math.Round(result.TotalCostUzs / rate, 2) : 0;
            result.NewMaterials = newMaterials.Values
                .Select(m => m.Brand is null ? $"{m.Name} ({m.Unit})" : $"{m.Name} [{m.Brand}] ({m.Unit})")
                .ToList();
            result.Projects = result.Rows
                .GroupBy(r => (r.ProjectId, r.ProjectName))
                .Select(g => new MaterialPurchaseImportProjectDto
                {
                    ProjectId = g.Key.ProjectId,
                    ProjectName = g.Key.ProjectName,
                    Count = g.Count(),
                    TotalCostUzs = g.Sum(r => r.TotalCostUzs)
                })
                .ToList();

            if (dryRun || result.Errors.Count > 0)
                return result;

            foreach (var (material, category) in categoryUpdates)
                material.Category = category;
            _context.Materials.AddRange(newMaterials.Values);
            _context.MaterialPurchases.AddRange(purchases);
            await _context.SaveChangesAsync();

            result.Created = purchases.Count;
            return result;
        }
    }

    private static void AddPurchaseIssue(MaterialPurchaseImportResultDto result, int row, string name, string prefix, List<string> errors)
    {
        var message = string.Join("; ", errors);
        result.Errors.Add(new MaterialImportIssueDto
        {
            Row = row,
            Name = name,
            Message = prefix + char.ToUpperInvariant(message[0]) + message[1..] + "."
        });
    }

    private static bool IsBlankNumber(IXLCell cell)
    {
        var v = cell.Value;
        if (v.IsBlank) return true;
        if (v.IsText) return string.IsNullOrWhiteSpace(v.GetText()) || v.GetText().Trim() == "-";
        return false;
    }

    private static decimal? ReadDecimal(IXLCell cell)
    {
        var value = cell.Value;
        if (value.IsBlank) return null;
        if (value.IsNumber) return (decimal)value.GetNumber();
        if (!value.IsText) return null;

        var text = value.GetText()
            .Replace(" ", "").Replace(" ", "").Replace(" ", "")
            .Replace("so'm", "", StringComparison.OrdinalIgnoreCase)
            .Replace("сум", "", StringComparison.OrdinalIgnoreCase);
        if (text.Contains(',') && text.Contains('.')) text = text.Replace(",", "");
        else if (text.Count(c => c == ',') == 1) text = text.Replace(',', '.');
        else text = text.Replace(",", "");

        return decimal.TryParse(text, NumberStyles.Number, CultureInfo.InvariantCulture, out var d) ? d : null;
    }
}

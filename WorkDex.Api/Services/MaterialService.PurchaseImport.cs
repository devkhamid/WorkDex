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

    private const int ColName = 1, ColUnit = 2, ColQty = 3, ColPrice = 4, ColTotal = 5;
    private const string NumberFormat = "_-* #,##0.0_-;\\-* #,##0.0_-;_-* \"-\"??_-;_-@_-";
    private static readonly XLColor HeaderFill = XLColor.FromHtml("#172B4D");
    private static readonly XLColor SectionFill = XLColor.FromHtml("#DDEBF1");

    private static readonly Dictionary<string, string> SectionTitles = new()
    {
        ["Qora ishlar"] = "Черновые работы",
        ["Elektr"] = "Электрические работы",
        ["Santexnika"] = "Сантехнические работы",
        ["Bo'yoq va suvoq"] = "Штукатурные и малярные работы",
        ["Gipsokarton"] = "Гипсокартонные работы",
        ["Plitka"] = "Облицовочные работы",
        ["Pol qoplamasi"] = "Напольные покрытия",
        ["Eshik va deraza"] = "Двери и окна",
        ["Isitish va ventilyatsiya"] = "Отопление и вентиляция",
        ["Boshqa"] = "Прочее",
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

    private static string SectionToCategory(string section)
    {
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

    public async Task<byte[]> BuildPurchaseImportTemplateAsync(Guid projectId, Guid requestingUserId)
    {
        var (project, companyAdminId) = await ResolvePurchaseContextAsync(projectId, requestingUserId);
        var catalog = await _context.Materials
            .AsNoTracking()
            .Where(m => m.CompanyAdminId == companyAdminId)
            .OrderBy(m => m.Name).ThenBy(m => m.Brand)
            .ToListAsync();

        using var workbook = new XLWorkbook();
        var ws = workbook.Worksheets.Add("Materiallar");

        ws.Range(1, ColName, 2, ColName).Merge().Value = "Наименование материалов";
        ws.Range(1, ColUnit, 2, ColUnit).Merge().Value = "ед.изм.";
        ws.Range(1, ColQty, 1, ColTotal).Merge().Value = project.Name;
        ws.Cell(2, ColQty).Value = "кол-во";
        ws.Cell(2, ColPrice).Value = "цена за ед.";
        ws.Cell(2, ColTotal).Value = "всего мат";

        var header = ws.Range(1, ColName, 2, ColTotal);
        header.Style.Font.Bold = true;
        header.Style.Font.FontColor = XLColor.White;
        header.Style.Fill.BackgroundColor = HeaderFill;
        header.Style.Alignment.Horizontal = XLAlignmentHorizontalValues.Center;
        header.Style.Alignment.Vertical = XLAlignmentVerticalValues.Center;
        header.Style.Alignment.WrapText = true;
        header.Style.Border.InsideBorder = XLBorderStyleValues.Thin;
        header.Style.Border.OutsideBorder = XLBorderStyleValues.Thin;
        ws.Row(2).Height = 30;
        ws.SheetView.FreezeRows(2);

        ws.Column(ColName).Width = 53;
        ws.Column(ColUnit).Width = 9;
        ws.Column(ColQty).Width = 10;
        ws.Column(ColPrice).Width = 14;
        ws.Column(ColTotal).Width = 16;

        var row = 3;
        void Section(string title)
        {
            var range = ws.Range(row, ColName, row, ColTotal);
            ws.Cell(row, ColName).Value = title;
            range.Style.Font.Bold = true;
            range.Style.Fill.BackgroundColor = SectionFill;
            row++;
        }
        void Item(Material? m)
        {
            if (m is not null)
            {
                ws.Cell(row, ColName).Value = m.Brand is null ? m.Name : $"{m.Name} [{m.Brand}]";
                ws.Cell(row, ColUnit).Value = m.Unit;
            }
            ws.Cell(row, ColTotal).FormulaA1 = $"IF(AND(C{row}<>\"\",D{row}<>\"\"),C{row}*D{row},\"\")";
            row++;
        }

        var byCategory = catalog
            .GroupBy(m => m.Category is not null && StandardCategories.Contains(m.Category) ? m.Category : "Boshqa")
            .ToDictionary(g => g.Key, g => g.ToList());

        foreach (var category in StandardCategories)
        {
            Section(SectionTitles[category]);
            if (byCategory.TryGetValue(category, out var items))
                foreach (var m in items) Item(m);
            for (var i = 0; i < 3; i++) Item(null);
        }

        var lastItemRow = row - 1;
        ws.Range(3, ColQty, lastItemRow, ColTotal).Style.NumberFormat.Format = NumberFormat;
        ws.Range(3, ColName, lastItemRow, ColTotal).Style.Border.InsideBorder = XLBorderStyleValues.Hair;
        ws.Range(3, ColName, lastItemRow, ColTotal).Style.Border.OutsideBorder = XLBorderStyleValues.Thin;

        row++;
        ws.Cell(row, ColName).Value = "Итого по материалу";
        ws.Cell(row, ColTotal).FormulaA1 = $"SUM(E3:E{lastItemRow})";
        var totalRange = ws.Range(row, ColName, row, ColTotal);
        totalRange.Style.Font.Bold = true;
        totalRange.Style.Fill.BackgroundColor = SectionFill;
        ws.Cell(row, ColTotal).Style.NumberFormat.Format = NumberFormat;

        var help = workbook.Worksheets.Add("Yo'riqnoma");
        var lines = new[]
        {
            $"«{project.Name}» loyihasiga material xaridlarini Excel orqali qo'shish",
            "",
            "1. \"Materiallar\" varag'ida har bir qatorga bitta material: nomi, o'lchov birligi, miqdori (кол-во) va birlik narxi (цена за ед.).",
            "2. Ko'k fonli qatorlar — bo'limlar (ish turi). Ularning ostidagi materiallar shu kategoriyaga kiradi.",
            "   O'z bo'limingizni qo'shishingiz mumkin: faqat A ustuniga nom yozing (masalan \"Монтаж освещения\").",
            "3. Katalogdagi materiallar oldindan yozilgan — faqat olinganlarining miqdori va narxini to'ldiring.",
            "   Miqdori va narxi bo'sh qatorlar o'tkazib yuboriladi.",
            "4. Yangi material qo'shish uchun bo'sh qatorga yozing. Brendni kvadrat qavsda yozish mumkin: \"Gipsokarton 12.5 [Knauf]\".",
            "5. Narxlar so'mda (UZS). Xarid sanasi yuklash oynasida tanlanadi.",
            "6. \"Итого по материалу\" qatoridan keyingi qatorlar o'qilmaydi.",
            "7. Yuklashdan oldin natija ko'rsatiladi: bitta qatorda ham xato bo'lsa, hech narsa saqlanmaydi.",
        };
        for (var i = 0; i < lines.Length; i++) help.Cell(i + 1, 1).Value = lines[i];
        help.Cell(1, 1).Style.Font.Bold = true;
        help.Cell(1, 1).Style.Font.FontSize = 13;
        help.Column(1).Width = 110;

        ws.SetTabActive();
        using var stream = new MemoryStream();
        workbook.SaveAs(stream);
        return stream.ToArray();
    }

    private async Task<(Project Project, Guid CompanyAdminId)> ResolvePurchaseContextAsync(Guid projectId, Guid userId)
    {
        var project = await _context.Projects.FindAsync(projectId)
            ?? throw new KeyNotFoundException("Loyiha topilmadi.");
        var user = await _context.Users.FindAsync(userId)
            ?? throw new KeyNotFoundException("Foydalanuvchi topilmadi.");
        return (project, project.CompanyAdminId ?? user.CompanyAdminId ?? userId);
    }

    public async Task<MaterialPurchaseImportResultDto> ImportPurchasesAsync(
        Guid projectId, Stream excelStream, Guid createdByUserId, bool dryRun, DateTime? purchaseDate = null)
    {
        var (_, companyAdminId) = await ResolvePurchaseContextAsync(projectId, createdByUserId);

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
            var ws = workbook.Worksheets.FirstOrDefault(w => w.Visibility == XLWorksheetVisibility.Visible)
                ?? throw new ArgumentException("Faylda varaq topilmadi.");

            var lastRow = ws.LastRowUsed()?.RowNumber() ?? 0;
            var firstRow = 3;
            for (var r = 1; r <= Math.Min(lastRow, 10); r++)
            {
                if (HeaderQtyPattern.IsMatch(ws.Cell(r, ColQty).GetFormattedString()))
                {
                    firstRow = r + 1;
                    break;
                }
            }
            if (lastRow - firstRow + 1 > MaxPurchaseImportRows)
                throw new ArgumentException($"Faylda juda ko'p qator bor. Bir martada ko'pi bilan {MaxPurchaseImportRows} ta qator yuklash mumkin.");

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
            string? currentCategory = null;

            for (var row = firstRow; row <= lastRow; row++)
            {
                var nameCell = ws.Cell(row, ColName);
                var rawName = Clean(nameCell.GetFormattedString());
                var unitRaw = Clean(ws.Cell(row, ColUnit).GetFormattedString());
                var qtyCell = ws.Cell(row, ColQty);
                var priceCell = ws.Cell(row, ColPrice);
                var qtyEmpty = IsBlankNumber(qtyCell);
                var priceEmpty = IsBlankNumber(priceCell);

                if (rawName is null)
                {
                    if (!qtyEmpty || !priceEmpty)
                        result.Errors.Add(new MaterialImportIssueDto { Row = row, Message = "Material nomi kiritilmagan." });
                    continue;
                }

                if (TotalRowPattern.IsMatch(rawName))
                    break;

                if (unitRaw is null && qtyEmpty && priceEmpty)
                {
                    if (!nameCell.Value.IsNumber)
                        currentCategory = SectionToCategory(rawName);
                    continue;
                }

                var qty = qtyEmpty ? null : ReadDecimal(qtyCell);
                var price = priceEmpty ? null : ReadDecimal(priceCell);
                var qtyInvalid = !qtyEmpty && qty is null;
                if (!qtyInvalid && (qty ?? 0) == 0)
                {
                    result.SkippedEmpty++;
                    continue;
                }

                result.TotalRows++;
                var (name, brand) = SplitBrand(rawName);
                var errors = new List<string>();
                if (name.Length > NameMaxLength) errors.Add($"nomi {NameMaxLength} belgidan oshmasligi kerak");
                if (brand is { Length: > BrandMaxLength }) errors.Add($"brend {BrandMaxLength} belgidan oshmasligi kerak");
                if (unitRaw is { Length: > UnitMaxLength }) errors.Add($"o'lchov birligi {UnitMaxLength} belgidan oshmasligi kerak");

                if (qty is null) errors.Add("miqdor (кол-во) kiritilmagan yoki noto'g'ri");
                else
                {
                    qty = Math.Round(qty.Value, 2);
                    if (qty < 0.01m) errors.Add("miqdor 0 dan katta bo'lishi kerak");
                }
                if (price is null) errors.Add("narx (цена за ед.) kiritilmagan yoki noto'g'ri");
                else
                {
                    price = Math.Round(price.Value, 2);
                    if (price < 0.01m) errors.Add("narx 0 dan katta bo'lishi kerak");
                }

                Material? material = null;
                var isNew = false;
                if (errors.Count == 0)
                {
                    var key = (MatchKey(name), MatchKey(brand));
                    if (catalog.TryGetValue(key, out var existing) || newMaterials.TryGetValue(key, out existing))
                    {
                        material = existing;
                        isNew = newMaterials.ContainsKey(key);
                        if (unitRaw is not null && MatchKey(CanonicalUnit(unitRaw)) != MatchKey(material.Unit))
                            errors.Add($"katalogda bu material \"{material.Unit}\" birligida, faylda \"{unitRaw}\" yozilgan");
                        if (currentCategory is not null && material.Category is null && !isNew)
                            categoryUpdates[material] = currentCategory;
                    }
                    else
                    {
                        material = new Material
                        {
                            Name = name,
                            Brand = brand,
                            Unit = unitRaw is null ? "dona" : CanonicalUnit(unitRaw),
                            Category = currentCategory,
                            CompanyAdminId = companyAdminId,
                            CreatedAt = now
                        };
                        newMaterials[key] = material;
                        isNew = true;
                    }
                }

                if (errors.Count > 0)
                {
                    var message = string.Join("; ", errors);
                    result.Errors.Add(new MaterialImportIssueDto
                    {
                        Row = row,
                        Name = rawName,
                        Message = char.ToUpperInvariant(message[0]) + message[1..] + "."
                    });
                    continue;
                }

                var total = Math.Round(qty!.Value * price!.Value, 2);
                purchases.Add(new MaterialPurchase
                {
                    ProjectId = projectId,
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

            if (result.TotalRows == 0 && result.Errors.Count == 0)
                throw new ArgumentException("Faylda miqdori va narxi to'ldirilgan birorta ham material topilmadi.");

            result.TotalCostUzs = purchases.Sum(p => p.TotalCost);
            result.TotalCostUsd = rate > 0 ? Math.Round(result.TotalCostUzs / rate, 2) : 0;
            result.NewMaterials = newMaterials.Values
                .Select(m => m.Brand is null ? $"{m.Name} ({m.Unit})" : $"{m.Name} [{m.Brand}] ({m.Unit})")
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

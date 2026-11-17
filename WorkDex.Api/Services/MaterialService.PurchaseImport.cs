using System.Globalization;
using ClosedXML.Excel;
using Microsoft.EntityFrameworkCore;
using WorkDex.Api.DTOs.Materials;
using WorkDex.Api.Models;

namespace WorkDex.Api.Services;

public partial class MaterialService
{
    public const int MaxPurchaseImportRows = 1000;

    private const string PurchaseSheetName = "Xaridlar";

    private static class PurchaseCol
    {
        public const int Name = 1, Brand = 2, Unit = 3, Category = 4, Quantity = 5, Price = 6,
            Currency = 7, Date = 8, Supplier = 9, Receipt = 10, Notes = 11, Count = 11;
    }

    private static readonly string[] DateFormats =
        { "dd.MM.yyyy", "d.M.yyyy", "dd.MM.yy", "d.M.yy", "yyyy-MM-dd", "dd/MM/yyyy", "d/M/yyyy", "dd-MM-yyyy" };

    private async Task<(Project Project, Guid CompanyAdminId)> ResolvePurchaseContextAsync(Guid projectId, Guid userId)
    {
        var project = await _context.Projects.FindAsync(projectId)
            ?? throw new KeyNotFoundException("Loyiha topilmadi.");
        var user = await _context.Users.FindAsync(userId)
            ?? throw new KeyNotFoundException("Foydalanuvchi topilmadi.");
        return (project, project.CompanyAdminId ?? user.CompanyAdminId ?? userId);
    }

    public async Task<byte[]> BuildPurchaseImportTemplateAsync(Guid projectId, Guid requestingUserId)
    {
        var (project, companyAdminId) = await ResolvePurchaseContextAsync(projectId, requestingUserId);
        var catalog = await _context.Materials
            .AsNoTracking()
            .Where(m => m.CompanyAdminId == companyAdminId)
            .OrderBy(m => m.Category == null).ThenBy(m => m.Category).ThenBy(m => m.Name).ThenBy(m => m.Brand)
            .ToListAsync();

        using var workbook = new XLWorkbook();
        var ws = workbook.Worksheets.Add(PurchaseSheetName);
        var headers = new[]
        {
            "Material nomi *", "Brend", "O'lchov birligi", "Kategoriya", "Miqdor *", "Birlik narxi *",
            "Valyuta (UZS/USD)", "Sana", "Yetkazib beruvchi", "Chek raqami", "Izoh"
        };
        for (var i = 0; i < headers.Length; i++)
            ws.Cell(1, i + 1).Value = headers[i];

        var header = ws.Range(1, 1, 1, headers.Length);
        header.Style.Font.Bold = true;
        header.Style.Font.FontColor = XLColor.White;
        header.Style.Fill.BackgroundColor = XLColor.FromHtml("#FF7A16");
        header.Style.Alignment.Horizontal = XLAlignmentHorizontalValues.Center;
        header.Style.Alignment.WrapText = true;
        ws.Row(1).Height = 30;
        ws.SheetView.FreezeRows(1);

        int[] widths = { 34, 18, 14, 22, 11, 16, 12, 13, 22, 14, 30 };
        for (var i = 0; i < widths.Length; i++) ws.Column(i + 1).Width = widths[i];

        var lastDataRow = MaxPurchaseImportRows + 1;
        foreach (var c in new[] { PurchaseCol.Name, PurchaseCol.Brand, PurchaseCol.Unit, PurchaseCol.Category,
                     PurchaseCol.Currency, PurchaseCol.Supplier, PurchaseCol.Receipt, PurchaseCol.Notes })
            ws.Range(2, c, lastDataRow, c).Style.NumberFormat.Format = "@";
        ws.Range(2, PurchaseCol.Quantity, lastDataRow, PurchaseCol.Quantity).Style.NumberFormat.Format = "#,##0.##";
        ws.Range(2, PurchaseCol.Price, lastDataRow, PurchaseCol.Price).Style.NumberFormat.Format = "#,##0.00";
        ws.Range(2, PurchaseCol.Date, lastDataRow, PurchaseCol.Date).Style.NumberFormat.Format = "dd.mm.yyyy";

        var lists = workbook.Worksheets.Add("Ro'yxatlar");
        for (var i = 0; i < StandardUnits.Length; i++) lists.Cell(i + 1, 1).Value = StandardUnits[i];
        for (var i = 0; i < StandardCategories.Length; i++) lists.Cell(i + 1, 2).Value = StandardCategories[i];
        lists.Cell(1, 3).Value = "UZS";
        lists.Cell(2, 3).Value = "USD";
        var catalogNames = catalog.Select(m => m.Name).Distinct(StringComparer.OrdinalIgnoreCase).ToList();
        for (var i = 0; i < catalogNames.Count; i++) lists.Cell(i + 1, 4).Value = catalogNames[i];
        lists.Visibility = XLWorksheetVisibility.Hidden;

        void AddList(int col, IXLRange source, string title, string message, XLErrorStyle style)
        {
            var dv = ws.Range(2, col, lastDataRow, col).CreateDataValidation();
            dv.List(source, true);
            dv.IgnoreBlanks = true;
            dv.ErrorStyle = style;
            dv.ShowErrorMessage = true;
            dv.ErrorTitle = title;
            dv.ErrorMessage = message;
        }

        if (catalogNames.Count > 0)
            AddList(PurchaseCol.Name, lists.Range(1, 4, catalogNames.Count, 4), "Yangi material",
                "Bu nom katalogda yo'q — yangi material sifatida qo'shiladi. Davom etish uchun \"Ha\" ni bosing.",
                XLErrorStyle.Warning);
        AddList(PurchaseCol.Unit, lists.Range(1, 1, StandardUnits.Length, 1), "Nostandart birlik",
            "Bu birlik ro'yxatda yo'q. Baribir qoldirish uchun \"Ha\" ni bosing.", XLErrorStyle.Warning);
        AddList(PurchaseCol.Category, lists.Range(1, 2, StandardCategories.Length, 2), "Nostandart kategoriya",
            "Bu kategoriya ro'yxatda yo'q. Baribir qoldirish uchun \"Ha\" ni bosing.", XLErrorStyle.Warning);
        AddList(PurchaseCol.Currency, lists.Range(1, 3, 2, 3), "Valyuta", "Faqat UZS yoki USD.", XLErrorStyle.Stop);

        var cat = workbook.Worksheets.Add("Katalog");
        string[] catHeaders = { "Material nomi", "Brend", "O'lchov birligi", "Kategoriya" };
        for (var i = 0; i < catHeaders.Length; i++) cat.Cell(1, i + 1).Value = catHeaders[i];
        cat.Range(1, 1, 1, catHeaders.Length).Style.Font.Bold = true;
        cat.Range(1, 1, 1, catHeaders.Length).Style.Fill.BackgroundColor = XLColor.FromHtml("#F2F4F7");
        for (var i = 0; i < catalog.Count; i++)
        {
            cat.Cell(i + 2, 1).Value = catalog[i].Name;
            cat.Cell(i + 2, 2).Value = catalog[i].Brand ?? "";
            cat.Cell(i + 2, 3).Value = catalog[i].Unit;
            cat.Cell(i + 2, 4).Value = catalog[i].Category ?? "";
        }
        cat.Column(1).Width = 34;
        cat.Column(2).Width = 20;
        cat.Column(3).Width = 14;
        cat.Column(4).Width = 24;
        cat.SheetView.FreezeRows(1);

        var help = workbook.Worksheets.Add("Yo'riqnoma");
        help.Cell(1, 1).Value = $"«{project.Name}» loyihasiga material xaridlarini Excel orqali qo'shish";
        help.Cell(1, 1).Style.Font.Bold = true;
        help.Cell(1, 1).Style.Font.FontSize = 13;
        var lines = new[]
        {
            $"1. \"{PurchaseSheetName}\" varag'ida har bir qatorga bitta xarid yozing (1-qator — sarlavha, uni o'zgartirmang).",
            "2. Majburiy ustunlar: Material nomi, Miqdor, Birlik narxi.",
            "3. Material nomi va brendi \"Katalog\" varag'idagidek yozilsa — katalogdagi material ishlatiladi.",
            "   Katalogda yo'q nom yangi material sifatida qo'shiladi (O'lchov birligi va Kategoriya shu holatda ishlatiladi).",
            "4. Katalogdagi material uchun o'lchov birligi yozilsa, u katalogdagisi bilan bir xil bo'lishi kerak.",
            "5. Valyuta: UZS yoki USD (bo'sh bo'lsa — UZS). USD narxlar joriy kurs bo'yicha so'mga o'giriladi.",
            "6. Sana: kk.oo.yyyy formatida (masalan 15.11.2026). Bo'sh bo'lsa — bugungi sana.",
            "7. Yuklashdan oldin natija ko'rsatiladi: bitta qatorda ham xato bo'lsa, hech narsa saqlanmaydi.",
            $"8. Bir faylda ko'pi bilan {MaxPurchaseImportRows} ta xarid bo'lishi mumkin.",
        };
        for (var i = 0; i < lines.Length; i++)
            help.Cell(i + 3, 1).Value = lines[i];
        help.Column(1).Width = 110;

        ws.SetTabActive();
        using var stream = new MemoryStream();
        workbook.SaveAs(stream);
        return stream.ToArray();
    }

    public async Task<MaterialPurchaseImportResultDto> ImportPurchasesAsync(Guid projectId, Stream excelStream, Guid createdByUserId, bool dryRun)
    {
        var (_, companyAdminId) = await ResolvePurchaseContextAsync(projectId, createdByUserId);

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
            var ws = workbook.Worksheets.FirstOrDefault(w => w.Name.Equals(PurchaseSheetName, StringComparison.OrdinalIgnoreCase))
                ?? workbook.Worksheets.FirstOrDefault(w => w.Visibility == XLWorksheetVisibility.Visible)
                ?? throw new ArgumentException("Faylda varaq topilmadi.");

            var lastRow = ws.LastRowUsed()?.RowNumber() ?? 1;
            if (lastRow - 1 > MaxPurchaseImportRows)
                throw new ArgumentException($"Faylda juda ko'p qator bor. Bir martada ko'pi bilan {MaxPurchaseImportRows} ta xarid yuklash mumkin.");

            var catalog = (await _context.Materials
                    .Where(m => m.CompanyAdminId == companyAdminId)
                    .ToListAsync())
                .GroupBy(m => (MatchKey(m.Name), MatchKey(m.Brand)))
                .ToDictionary(g => g.Key, g => g.OrderBy(m => m.CreatedAt).First());

            var rate = await Money.CurrentRateAsync(_currencyService);
            var today = DateTime.SpecifyKind(DateTime.UtcNow.Date, DateTimeKind.Utc);
            var now = DateTime.UtcNow;

            var result = new MaterialPurchaseImportResultDto { DryRun = dryRun, ExchangeRate = rate };
            var newMaterials = new Dictionary<(string, string), Material>();
            var categoryUpdates = new Dictionary<Material, string>();
            var purchases = new List<MaterialPurchase>();

            for (var row = 2; row <= lastRow; row++)
            {
                var cells = Enumerable.Range(1, PurchaseCol.Count).Select(c => ws.Cell(row, c)).ToArray();
                if (cells.All(c => string.IsNullOrWhiteSpace(c.GetFormattedString())))
                    continue;

                result.TotalRows++;
                string Text(int col) => cells[col - 1].GetFormattedString();
                var name = Clean(Text(PurchaseCol.Name));
                var brand = Clean(Text(PurchaseCol.Brand));
                var unitRaw = Clean(Text(PurchaseCol.Unit));
                var categoryRaw = Text(PurchaseCol.Category);
                var supplier = Clean(Text(PurchaseCol.Supplier));
                var receipt = Clean(Text(PurchaseCol.Receipt));
                var notes = Text(PurchaseCol.Notes)?.Trim();

                var errors = new List<string>();
                if (name is null) errors.Add("material nomi kiritilmagan");
                else if (name.Length > NameMaxLength) errors.Add($"nomi {NameMaxLength} belgidan oshmasligi kerak");
                if (brand is { Length: > BrandMaxLength }) errors.Add($"brend {BrandMaxLength} belgidan oshmasligi kerak");
                if (unitRaw is { Length: > UnitMaxLength }) errors.Add($"o'lchov birligi {UnitMaxLength} belgidan oshmasligi kerak");
                if (supplier is { Length: > 200 }) errors.Add("yetkazib beruvchi 200 belgidan oshmasligi kerak");
                if (receipt is { Length: > 100 }) errors.Add("chek raqami 100 belgidan oshmasligi kerak");
                if (notes is { Length: > DescriptionMaxLength }) errors.Add($"izoh {DescriptionMaxLength} belgidan oshmasligi kerak");

                var quantity = ReadDecimal(cells[PurchaseCol.Quantity - 1]);
                if (quantity is null) errors.Add("miqdor kiritilmagan yoki noto'g'ri");
                else
                {
                    quantity = Math.Round(quantity.Value, 2);
                    if (quantity < 0.01m) errors.Add("miqdor 0 dan katta bo'lishi kerak");
                }

                var price = ReadDecimal(cells[PurchaseCol.Price - 1]);
                if (price is null) errors.Add("birlik narxi kiritilmagan yoki noto'g'ri");
                else
                {
                    price = Math.Round(price.Value, 2);
                    if (price < 0.01m) errors.Add("birlik narxi 0 dan katta bo'lishi kerak");
                }

                var currency = ParseCurrency(Text(PurchaseCol.Currency));
                if (currency is null) errors.Add("valyuta faqat UZS yoki USD bo'lishi mumkin");

                var date = ReadDate(cells[PurchaseCol.Date - 1], today);
                if (date is null) errors.Add("sana noto'g'ri (kk.oo.yyyy formatida yozing)");
                else if (date.Value > today.AddDays(1)) errors.Add("sana kelajakda bo'lishi mumkin emas");

                Material? material = null;
                var isNew = false;
                if (name is not null && errors.Count == 0)
                {
                    var key = (MatchKey(name), MatchKey(brand));
                    if (catalog.TryGetValue(key, out var existing) || newMaterials.TryGetValue(key, out existing))
                    {
                        material = existing;
                        isNew = newMaterials.ContainsKey(key);
                        if (unitRaw is not null && MatchKey(CanonicalUnit(unitRaw)) != MatchKey(material.Unit))
                            errors.Add($"katalogda bu material \"{material.Unit}\" birligida, faylda \"{unitRaw}\" yozilgan");
                        var category = NormalizeCategory(categoryRaw);
                        if (category is not null && material.Category is null && !isNew)
                            categoryUpdates[material] = category;
                    }
                    else
                    {
                        material = new Material
                        {
                            Name = name,
                            Brand = brand,
                            Unit = unitRaw is null ? "dona" : CanonicalUnit(unitRaw),
                            Category = NormalizeCategory(categoryRaw),
                            CompanyAdminId = companyAdminId,
                            CreatedAt = now
                        };
                        newMaterials[key] = material;
                        isNew = true;
                    }
                }

                if (errors.Count > 0)
                {
                    result.Errors.Add(new MaterialImportIssueDto
                    {
                        Row = row,
                        Name = name,
                        Message = char.ToUpperInvariant(errors[0][0]) + string.Join("; ", errors)[1..] + "."
                    });
                    continue;
                }

                var unitPriceUzs = Money.ToUzs(price!.Value, currency!, rate);
                var total = Math.Round(quantity!.Value * unitPriceUzs, 2);
                purchases.Add(new MaterialPurchase
                {
                    ProjectId = projectId,
                    MaterialId = material!.Id,
                    Material = material,
                    Quantity = quantity.Value,
                    Unit = material.Unit,
                    UnitPrice = unitPriceUzs,
                    TotalCost = total,
                    Currency = currency!,
                    ExchangeRateToUzs = rate,
                    OriginalUnitPrice = price.Value,
                    Brand = material.Brand,
                    Supplier = supplier,
                    PurchaseDate = date!.Value,
                    ReceiptNumber = receipt,
                    Notes = string.IsNullOrEmpty(notes) ? null : notes,
                    CreatedByUserId = createdByUserId,
                    CreatedAt = now
                });
                result.Rows.Add(new MaterialPurchaseImportRowDto
                {
                    Row = row,
                    MaterialName = material.Name,
                    Brand = material.Brand,
                    Unit = material.Unit,
                    Quantity = quantity.Value,
                    UnitPrice = price.Value,
                    Currency = currency!,
                    TotalCostUzs = total,
                    PurchaseDate = date.Value,
                    IsNewMaterial = isNew
                });
            }

            if (result.TotalRows == 0)
                throw new ArgumentException("Faylda birorta ham xarid topilmadi. Xaridlarni 2-qatordan boshlab yozing.");

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

    private static string? ParseCurrency(string? raw)
    {
        var key = MatchKey(raw);
        if (key.Length == 0) return "UZS";
        return key switch
        {
            "uzs" or "so'm" or "som" or "sum" or "сум" or "сўм" => "UZS",
            "usd" or "$" or "dollar" or "доллар" => "USD",
            _ => null
        };
    }

    private static decimal? ReadDecimal(IXLCell cell)
    {
        var value = cell.Value;
        if (value.IsBlank) return null;
        if (value.IsNumber) return (decimal)value.GetNumber();

        var text = cell.GetFormattedString()
            .Replace(" ", "").Replace(" ", "").Replace(" ", "")
            .Replace("so'm", "", StringComparison.OrdinalIgnoreCase)
            .Replace("$", "");
        if (text.Contains(',') && text.Contains('.')) text = text.Replace(",", "");
        else if (text.Count(c => c == ',') == 1) text = text.Replace(',', '.');
        else text = text.Replace(",", "");

        return decimal.TryParse(text, NumberStyles.Number, CultureInfo.InvariantCulture, out var d) ? d : null;
    }

    private static DateTime? ReadDate(IXLCell cell, DateTime fallback)
    {
        var value = cell.Value;
        if (value.IsBlank) return fallback;
        if (value.IsDateTime) return DateTime.SpecifyKind(value.GetDateTime().Date, DateTimeKind.Utc);
        if (value.IsNumber)
        {
            var n = value.GetNumber();
            if (n is < 1 or > 2958465) return null;
            return DateTime.SpecifyKind(DateTime.FromOADate(n).Date, DateTimeKind.Utc);
        }

        var text = cell.GetFormattedString().Trim();
        if (text.Length == 0) return fallback;
        return DateTime.TryParseExact(text, DateFormats, CultureInfo.InvariantCulture, DateTimeStyles.None, out var d)
            ? DateTime.SpecifyKind(d.Date, DateTimeKind.Utc)
            : null;
    }
}

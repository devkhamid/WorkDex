using ClosedXML.Excel;
using Microsoft.EntityFrameworkCore;
using WorkDex.Api.DTOs.Materials;
using WorkDex.Api.Models;

namespace WorkDex.Api.Services;

public partial class MaterialService
{
    public const int MaxImportRows = 5000;

    private const string ImportSheetName = "Materiallar";
    private const int NameMaxLength = 200;
    private const int BrandMaxLength = 200;
    private const int UnitMaxLength = 50;
    private const int DescriptionMaxLength = 1000;

    private static readonly string[] StandardUnits =
        { "dona", "m²", "kg", "qop", "m³", "metr", "litr", "komplekt", "list", "rulon" };

    private static readonly Dictionary<string, string> UnitAliases = BuildUnitAliases();

    private static Dictionary<string, string> BuildUnitAliases()
    {
        var map = new Dictionary<string, string>();
        foreach (var unit in StandardUnits) map[MatchKey(unit)] = unit;

        void Alias(string canonical, params string[] aliases)
        {
            foreach (var a in aliases) map[MatchKey(a)] = canonical;
        }

        Alias("dona", "ta", "shtuk", "шт", "штук", "pcs");
        Alias("m²", "m2", "kv.m", "kvm", "kv m", "м2", "м²");
        Alias("m³", "m3", "kub", "kub.m", "м3", "м³");
        Alias("metr", "m", "mtr", "м", "метр");
        Alias("litr", "l", "lt", "л", "литр");
        Alias("kg", "кг", "kilogramm");
        Alias("komplekt", "kompl", "компл", "комплект");
        Alias("rulon", "рулон");
        Alias("qop", "мешок");
        return map;
    }

    private static string CanonicalUnit(string unit) =>
        UnitAliases.TryGetValue(MatchKey(unit), out var canonical) ? canonical : unit;

    public static readonly string[] StandardCategories =
    {
        "Qora ishlar", "Elektr", "Santexnika", "Bo'yoq va suvoq", "Gipsokarton",
        "Plitka", "Pol qoplamasi", "Eshik va deraza", "Isitish va ventilyatsiya", "Boshqa"
    };

    private const int CategoryMaxLength = 100;

    private static readonly Dictionary<string, string> CategoryAliases = BuildCategoryAliases();

    private static Dictionary<string, string> BuildCategoryAliases()
    {
        var map = new Dictionary<string, string>();
        foreach (var c in StandardCategories) map[MatchKey(c)] = c;

        void Alias(string canonical, params string[] aliases)
        {
            foreach (var a in aliases) map[MatchKey(a)] = canonical;
        }

        Alias("Qora ishlar", "qora", "qurilish", "черновые", "черновые работы");
        Alias("Elektr", "elektrika", "elektr ishlari", "elektrik", "электрика", "электро");
        Alias("Santexnika", "santehnika", "santexnik", "сантехника");
        Alias("Bo'yoq va suvoq", "bo'yoq", "boyoq", "suvoq", "malyar", "malyarka", "shpaklyovka", "bo'yoq-badiiy",
            "малярка", "малярные", "покраска", "штукатурка", "шпаклевка");
        Alias("Gipsokarton", "gkl", "гипсокартон", "гкл");
        Alias("Plitka", "kafel", "плитка", "кафель");
        Alias("Pol qoplamasi", "pol", "laminat", "parket", "пол", "ламинат", "паркет");
        Alias("Eshik va deraza", "eshik", "deraza", "двери", "окна");
        Alias("Isitish va ventilyatsiya", "isitish", "ventilyatsiya", "konditsioner", "отопление", "вентиляция");
        Alias("Boshqa", "другое", "прочее");
        return map;
    }

    internal static string? NormalizeCategory(string? category)
    {
        var cleaned = Clean(category);
        if (cleaned is null) return null;
        if (CategoryAliases.TryGetValue(MatchKey(cleaned), out var canonical)) return canonical;
        return cleaned.Length > CategoryMaxLength ? cleaned[..CategoryMaxLength] : cleaned;
    }

    public byte[] BuildImportTemplate()
    {
        using var workbook = new XLWorkbook();

        var ws = workbook.Worksheets.Add(ImportSheetName);
        var headers = new[] { "Nomi *", "Brend", "O'lchov birligi *", "Tavsif", "Kategoriya" };
        for (var i = 0; i < headers.Length; i++)
            ws.Cell(1, i + 1).Value = headers[i];

        var header = ws.Range(1, 1, 1, headers.Length);
        header.Style.Font.Bold = true;
        header.Style.Font.FontColor = XLColor.White;
        header.Style.Fill.BackgroundColor = XLColor.FromHtml("#FF7A16");
        header.Style.Alignment.Horizontal = XLAlignmentHorizontalValues.Center;
        ws.Row(1).Height = 22;
        ws.SheetView.FreezeRows(1);

        ws.Column(1).Width = 36;
        ws.Column(2).Width = 22;
        ws.Column(3).Width = 18;
        ws.Column(4).Width = 44;
        ws.Column(5).Width = 26;
        ws.Range(2, 1, MaxImportRows + 1, 5).Style.NumberFormat.Format = "@";

        var unitsSheet = workbook.Worksheets.Add("Birliklar");
        for (var i = 0; i < StandardUnits.Length; i++)
            unitsSheet.Cell(i + 1, 1).Value = StandardUnits[i];
        for (var i = 0; i < StandardCategories.Length; i++)
            unitsSheet.Cell(i + 1, 2).Value = StandardCategories[i];
        unitsSheet.Visibility = XLWorksheetVisibility.Hidden;

        var categoryValidation = ws.Range(2, 5, MaxImportRows + 1, 5).CreateDataValidation();
        categoryValidation.List(unitsSheet.Range(1, 2, StandardCategories.Length, 2), true);
        categoryValidation.IgnoreBlanks = true;
        categoryValidation.ErrorStyle = XLErrorStyle.Warning;
        categoryValidation.ShowErrorMessage = true;
        categoryValidation.ErrorTitle = "Nostandart kategoriya";
        categoryValidation.ErrorMessage = "Bu kategoriya ro'yxatda yo'q. Baribir qoldirish uchun \"Ha\" ni bosing.";

        var validation = ws.Range(2, 3, MaxImportRows + 1, 3).CreateDataValidation();
        validation.List(unitsSheet.Range(1, 1, StandardUnits.Length, 1), true);
        validation.IgnoreBlanks = true;
        validation.ErrorStyle = XLErrorStyle.Warning;
        validation.ShowErrorMessage = true;
        validation.ErrorTitle = "Nostandart birlik";
        validation.ErrorMessage = "Bu birlik ro'yxatda yo'q. Baribir qoldirish uchun \"Ha\" ni bosing.";

        var help = workbook.Worksheets.Add("Yo'riqnoma");
        help.Cell(1, 1).Value = "Materiallarni Excel orqali qo'shish";
        help.Cell(1, 1).Style.Font.Bold = true;
        help.Cell(1, 1).Style.Font.FontSize = 14;
        var lines = new[]
        {
            $"1. \"{ImportSheetName}\" varag'ida har bir qatorga bitta material yozing (1-qator — sarlavha, uni o'zgartirmang).",
            "2. \"Nomi\" va \"O'lchov birligi\" majburiy. \"Brend\", \"Tavsif\" va \"Kategoriya\" ixtiyoriy.",
            "3. O'lchov birligini ro'yxatdan tanlang: " + string.Join(", ", StandardUnits) + ".",
            "4. Kategoriya — material qaysi ish uchun ishlatiladi: " + string.Join(", ", StandardCategories) + ".",
            "5. Katalogda allaqachon bor material (nomi + brendi bir xil) qayta qo'shilmaydi — o'tkazib yuboriladi.",
            $"6. Bir faylda ko'pi bilan {MaxImportRows} ta material bo'lishi mumkin.",
            "",
            "Namuna:",
        };
        for (var i = 0; i < lines.Length; i++)
            help.Cell(i + 3, 1).Value = lines[i];

        var sampleRow = lines.Length + 3;
        var sample = new[,]
        {
            { "Nomi", "Brend", "O'lchov birligi", "Tavsif", "Kategoriya" },
            { "Gipsokarton 12.5 mm", "Knauf", "list", "Devor va shift uchun", "Gipsokarton" },
            { "Plitka yelim", "Ceresit CM 11", "qop", "25 kg", "Plitka" },
            { "Kabel 3x2.5", "", "metr", "", "Elektr" },
            { "Interyer bo'yog'i", "Caparol", "litr", "", "Bo'yoq va suvoq" },
        };
        var sampleCols = sample.GetLength(1);
        for (var r = 0; r < sample.GetLength(0); r++)
        for (var c = 0; c < sampleCols; c++)
            help.Cell(sampleRow + r, c + 1).Value = sample[r, c];
        help.Range(sampleRow, 1, sampleRow, sampleCols).Style.Font.Bold = true;
        help.Range(sampleRow, 1, sampleRow + sample.GetLength(0) - 1, sampleCols).Style.Border.OutsideBorder = XLBorderStyleValues.Thin;
        help.Column(1).Width = 30;
        help.Column(2).Width = 20;
        help.Column(3).Width = 18;
        help.Column(4).Width = 26;
        help.Column(5).Width = 24;

        ws.SetTabActive();
        using var stream = new MemoryStream();
        workbook.SaveAs(stream);
        return stream.ToArray();
    }

    public async Task<MaterialImportResultDto> ImportMaterialsAsync(Stream excelStream, Guid createdByUserId)
    {
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
            var ws = workbook.Worksheets.FirstOrDefault(w => w.Name.Equals(ImportSheetName, StringComparison.OrdinalIgnoreCase))
                ?? workbook.Worksheets.FirstOrDefault(w => w.Visibility == XLWorksheetVisibility.Visible)
                ?? throw new ArgumentException("Faylda varaq topilmadi.");

            var lastRow = ws.LastRowUsed()?.RowNumber() ?? 1;
            if (lastRow - 1 > MaxImportRows)
                throw new ArgumentException($"Faylda juda ko'p qator bor. Bir martada ko'pi bilan {MaxImportRows} ta material yuklash mumkin.");

            var requestingUser = await _context.Users.FindAsync(createdByUserId);
            var companyAdminId = requestingUser?.CompanyAdminId ?? createdByUserId;

            var existing = await _context.Materials
                .AsNoTracking()
                .Where(m => m.CompanyAdminId == companyAdminId)
                .Select(m => new { m.Name, m.Brand })
                .ToListAsync();
            var existingKeys = existing
                .Select(m => (MatchKey(m.Name), MatchKey(m.Brand)))
                .ToHashSet();
            var seenInFile = new Dictionary<(string, string), int>();

            var result = new MaterialImportResultDto();
            var now = DateTime.UtcNow;

            for (var row = 2; row <= lastRow; row++)
            {
                var rawName = ws.Cell(row, 1).GetFormattedString();
                var rawBrand = ws.Cell(row, 2).GetFormattedString();
                var rawUnit = ws.Cell(row, 3).GetFormattedString();
                var rawDesc = ws.Cell(row, 4).GetFormattedString();
                var rawCategory = ws.Cell(row, 5).GetFormattedString();

                if (string.IsNullOrWhiteSpace(rawName) && string.IsNullOrWhiteSpace(rawBrand) &&
                    string.IsNullOrWhiteSpace(rawUnit) && string.IsNullOrWhiteSpace(rawDesc) &&
                    string.IsNullOrWhiteSpace(rawCategory))
                    continue;

                result.TotalRows++;
                var name = Clean(rawName);
                var brand = Clean(rawBrand);
                var unit = Clean(rawUnit);
                var description = rawDesc?.Trim();

                string? error = null;
                if (name is null) error = "Material nomi kiritilmagan.";
                else if (name.Length > NameMaxLength) error = $"Nomi {NameMaxLength} belgidan oshmasligi kerak.";
                else if (unit is null) error = "O'lchov birligi kiritilmagan.";
                else if (unit.Length > UnitMaxLength) error = $"O'lchov birligi {UnitMaxLength} belgidan oshmasligi kerak.";
                else if (brand is { Length: > BrandMaxLength }) error = $"Brend {BrandMaxLength} belgidan oshmasligi kerak.";
                else if (description is { Length: > DescriptionMaxLength }) error = $"Tavsif {DescriptionMaxLength} belgidan oshmasligi kerak.";
                else if (Clean(rawCategory) is { Length: > CategoryMaxLength }) error = $"Kategoriya {CategoryMaxLength} belgidan oshmasligi kerak.";

                if (error is not null)
                {
                    result.Errors.Add(new MaterialImportIssueDto { Row = row, Name = name, Message = error });
                    continue;
                }

                var key = (MatchKey(name), MatchKey(brand));
                if (existingKeys.Contains(key))
                {
                    result.Skipped.Add(new MaterialImportIssueDto { Row = row, Name = name, Message = "Katalogda allaqachon mavjud." });
                    continue;
                }
                if (seenInFile.TryGetValue(key, out var firstRow))
                {
                    result.Skipped.Add(new MaterialImportIssueDto { Row = row, Name = name, Message = $"Faylda takrorlangan ({firstRow}-qator bilan bir xil)." });
                    continue;
                }
                seenInFile[key] = row;

                _context.Materials.Add(new Material
                {
                    Name = name!,
                    Brand = brand,
                    Unit = CanonicalUnit(unit!),
                    Category = NormalizeCategory(rawCategory),
                    Description = string.IsNullOrEmpty(description) ? null : description,
                    CompanyAdminId = companyAdminId,
                    CreatedAt = now
                });
                result.Created++;
            }

            if (result.TotalRows == 0)
                throw new ArgumentException("Faylda birorta ham material topilmadi. Materiallarni 2-qatordan boshlab yozing.");

            if (result.Created > 0)
                await _context.SaveChangesAsync();

            return result;
        }
    }
}

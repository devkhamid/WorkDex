using System.Globalization;
using System.Text;
using Microsoft.EntityFrameworkCore;
using WorkDex.Api.Data;
using WorkDex.Api.DTOs.Materials;
using WorkDex.Api.Models;

namespace WorkDex.Api.Services;

public class MaterialService : IMaterialService
{
    private readonly AppDbContext _context;
    private readonly ICurrencyService _currencyService;

    public MaterialService(AppDbContext context, ICurrencyService currencyService)
    {
        _context = context;
        _currencyService = currencyService;
    }

    public async Task<List<MaterialDto>> GetAllMaterialsAsync(Guid requestingUserId, UserRole requestingUserRole)
    {
        var query = _context.Materials.AsQueryable();

        if (requestingUserRole == UserRole.SuperAdmin)
        {
            // SuperAdmin barcha materiallarni ko'radi
        }
        else
        {
            var user = await _context.Users.FindAsync(requestingUserId);
            var targetCompanyAdminId = user?.CompanyAdminId ?? requestingUserId;
            query = query.Where(m => m.CompanyAdminId == targetCompanyAdminId);
        }

        var materials = await query
            .OrderBy(m => m.Name)
            .Select(m => new { Material = m, Count = m.Purchases.Count })
            .ToListAsync();

        return materials.Select(x => ToDto(x.Material, x.Count)).ToList();
    }

    public async Task<MaterialDto> GetMaterialByIdAsync(Guid id, Guid requestingUserId, UserRole requestingUserRole)
    {
        var material = await _context.Materials.FindAsync(id);
        if (material is null)
            throw new KeyNotFoundException("Material topilmadi.");

        await EnsureSameCompanyAsync(material, requestingUserId, requestingUserRole);

        return new MaterialDto
        {
            Id = material.Id,
            Name = material.Name,
            Brand = material.Brand,
            Unit = material.Unit,
            Description = material.Description,
            CreatedAt = material.CreatedAt
        };
    }

    public async Task<MaterialDto> CreateMaterialAsync(CreateMaterialDto dto, Guid createdByUserId)
    {
        var requestingUser = await _context.Users.FindAsync(createdByUserId);
        var companyAdminId = requestingUser?.CompanyAdminId ?? createdByUserId;

        var name = Clean(dto.Name) ?? throw new InvalidOperationException("Material nomi bo'sh bo'lishi mumkin emas.");
        var brand = Clean(dto.Brand);

        var existing = await FindMaterialAsync(companyAdminId, name, brand);
        if (existing is not null)
            throw new InvalidOperationException(
                $"\"{existing.Name}{(existing.Brand is null ? "" : $" [{existing.Brand}]")}\" katalogda allaqachon mavjud.");

        var material = new Material
        {
            Name = name,
            Brand = brand,
            Unit = Clean(dto.Unit) ?? "dona",
            Description = dto.Description?.Trim(),
            CompanyAdminId = companyAdminId,
            CreatedAt = DateTime.UtcNow
        };

        _context.Materials.Add(material);
        await _context.SaveChangesAsync();

        return new MaterialDto
        {
            Id = material.Id,
            Name = material.Name,
            Brand = material.Brand,
            Unit = material.Unit,
            Description = material.Description,
            CreatedAt = material.CreatedAt
        };
    }

    public async Task<MaterialDto> UpdateMaterialAsync(Guid id, CreateMaterialDto dto, Guid requestingUserId, UserRole requestingUserRole)
    {
        var material = await _context.Materials.FindAsync(id);
        if (material is null)
            throw new KeyNotFoundException("Material topilmadi.");

        await EnsureSameCompanyAsync(material, requestingUserId, requestingUserRole);

        var name = Clean(dto.Name) ?? throw new InvalidOperationException("Material nomi bo'sh bo'lishi mumkin emas.");
        var brand = Clean(dto.Brand);
        var duplicate = await FindMaterialAsync(material.CompanyAdminId, name, brand, excludeId: material.Id);
        if (duplicate is not null)
            throw new InvalidOperationException("Bunday nom va brenddagi material katalogda allaqachon mavjud.");

        material.Name = name;
        material.Brand = brand;
        material.Unit = Clean(dto.Unit) ?? material.Unit;
        material.Description = dto.Description?.Trim();

        await _context.SaveChangesAsync();

        return new MaterialDto
        {
            Id = material.Id,
            Name = material.Name,
            Brand = material.Brand,
            Unit = material.Unit,
            Description = material.Description,
            CreatedAt = material.CreatedAt
        };
    }

    public async Task DeleteMaterialAsync(Guid id, Guid requestingUserId, UserRole requestingUserRole)
    {
        var material = await _context.Materials
            .Include(m => m.Purchases)
            .FirstOrDefaultAsync(m => m.Id == id);

        if (material is null)
            throw new KeyNotFoundException("Material topilmadi.");

        await EnsureSameCompanyAsync(material, requestingUserId, requestingUserRole);

        if (material.Purchases.Any())
            throw new InvalidOperationException("Ushbu material xaridlarda ishlatilgan, uni o'chirib bo'lmaydi.");

        _context.Materials.Remove(material);
        await _context.SaveChangesAsync();
    }

    // Takroriy (yozuv xatosi bilan kiritilgan) materialni boshqasiga birlashtiradi:
    // barcha xaridlar target ga o'tkaziladi va source o'chiriladi
    public async Task<MaterialDto> MergeMaterialAsync(Guid sourceId, Guid targetId, Guid requestingUserId, UserRole requestingUserRole)
    {
        if (sourceId == targetId)
            throw new InvalidOperationException("Materialni o'ziga birlashtirib bo'lmaydi.");

        var source = await _context.Materials.Include(m => m.Purchases).FirstOrDefaultAsync(m => m.Id == sourceId)
            ?? throw new KeyNotFoundException("Material topilmadi.");
        var target = await _context.Materials.FirstOrDefaultAsync(m => m.Id == targetId)
            ?? throw new KeyNotFoundException("Birlashtiriladigan material topilmadi.");

        await EnsureSameCompanyAsync(source, requestingUserId, requestingUserRole);
        await EnsureSameCompanyAsync(target, requestingUserId, requestingUserRole);
        if (source.CompanyAdminId != target.CompanyAdminId)
            throw new InvalidOperationException("Materiallar turli kompaniyalarga tegishli.");
        if (MatchKey(source.Unit) != MatchKey(target.Unit))
            throw new InvalidOperationException(
                $"O'lchov birliklari har xil ({source.Unit} va {target.Unit}) — bunday materiallarni birlashtirib bo'lmaydi.");

        foreach (var p in source.Purchases)
        {
            p.MaterialId = target.Id;
            p.Brand = target.Brand;
            p.Unit = target.Unit;
        }
        _context.Materials.Remove(source);
        await _context.SaveChangesAsync();

        var count = await _context.MaterialPurchases.CountAsync(p => p.MaterialId == target.Id);
        return ToDto(target, count);
    }

    private static MaterialDto ToDto(Material m, int purchaseCount = 0) => new()
    {
        Id = m.Id,
        Name = m.Name,
        Brand = m.Brand,
        Unit = m.Unit,
        Description = m.Description,
        PurchaseCount = purchaseCount,
        CreatedAt = m.CreatedAt
    };

    private async Task<Guid> ResolveCompanyAdminIdAsync(Guid requestingUserId, UserRole requestingUserRole)
    {
        var user = await _context.Users.FindAsync(requestingUserId);
        return user?.CompanyAdminId ?? requestingUserId;
    }

    private async Task EnsureSameCompanyAsync(Material material, Guid requestingUserId, UserRole requestingUserRole)
    {
        if (requestingUserRole == UserRole.SuperAdmin) return;
        var companyAdminId = await ResolveCompanyAdminIdAsync(requestingUserId, requestingUserRole);
        if (material.CompanyAdminId != companyAdminId)
            throw new KeyNotFoundException("Material topilmadi.");
    }

    // Ortiqcha bo'shliqlarni olib tashlaydi; bo'sh bo'lsa null
    private static string? Clean(string? value)
    {
        if (string.IsNullOrWhiteSpace(value)) return null;
        return string.Join(' ', value.Split((char[]?)null, StringSplitOptions.RemoveEmptyEntries));
    }

    private static string MatchKey(string? value)
    {
        var cleaned = Clean(value);
        if (cleaned is null) return string.Empty;
        // Katta-kichik harf, diakritika (ı/i, ç/c, ş/s, ğ/g, ö/o, ü/u) va apostrof turlari farqlanmaydi
        var decomposed = cleaned.ToLowerInvariant().Replace('\u0131', 'i').Normalize(NormalizationForm.FormD);
        var sb = new StringBuilder(decomposed.Length);
        foreach (var ch in decomposed)
        {
            if (CharUnicodeInfo.GetUnicodeCategory(ch) == UnicodeCategory.NonSpacingMark) continue;
            sb.Append(ch is '\u2018' or '\u2019' or '\u02BB' or '\u02BC' or '`' ? '\'' : ch);
        }
        return sb.ToString();
    }

    // Bir kompaniya katalogi kichik, shuning uchun solishtirish xotirada bajariladi
    private async Task<Material?> FindMaterialAsync(Guid? companyAdminId, string name, string? brand, Guid? excludeId = null)
    {
        var nameKey = MatchKey(name);
        var brandKey = MatchKey(brand);
        var candidates = await _context.Materials
            .Where(m => m.CompanyAdminId == companyAdminId && (excludeId == null || m.Id != excludeId))
            .ToListAsync();
        return candidates
            .Where(m => MatchKey(m.Name) == nameKey && MatchKey(m.Brand) == brandKey)
            .OrderBy(m => m.CreatedAt)
            .FirstOrDefault();
    }

    private async Task<Material> FindOrCreateMaterialAsync(Guid? companyAdminId, string name, string? brand, string? unit)
    {
        var existing = await FindMaterialAsync(companyAdminId, name, brand);
        if (existing is not null) return existing;

        var material = new Material
        {
            Name = name,
            Brand = brand,
            Unit = Clean(unit) ?? "dona",
            CompanyAdminId = companyAdminId,
            CreatedAt = DateTime.UtcNow
        };
        _context.Materials.Add(material);
        return material;
    }

    public async Task<MaterialPurchaseDto> AddPurchaseAsync(Guid projectId, CreateMaterialPurchaseDto dto, Guid createdByUserId)
    {
        var project = await _context.Projects.FindAsync(projectId);
        if (project is null)
            throw new KeyNotFoundException("Loyiha topilmadi.");

        var user = await _context.Users.FindAsync(createdByUserId);
        if (user is null)
            throw new KeyNotFoundException("Foydalanuvchi topilmadi.");

        var companyAdminId = project.CompanyAdminId ?? user.CompanyAdminId ?? createdByUserId;
        var brand = Clean(dto.Brand);
        Material material;

        var typedName = Clean(dto.MaterialName);
        if (typedName is not null)
        {
            material = await FindOrCreateMaterialAsync(companyAdminId, typedName, brand, dto.Unit);
        }
        else
        {
            if (dto.MaterialId is null)
                throw new InvalidOperationException("Material nomini kiriting yoki katalogdan tanlang.");

            material = await _context.Materials.FindAsync(dto.MaterialId.Value)
                ?? throw new KeyNotFoundException("Material topilmadi.");

            // Material o'z kompaniyasiga tegishli ekanini tekshirish
            if (project.CompanyAdminId != null && material.CompanyAdminId != null && material.CompanyAdminId != project.CompanyAdminId)
                throw new InvalidOperationException("Tanlangan material boshqa kompaniyaga tegishli.");

            // Brend boshqacha yozilgan bo'lsa — bu boshqa (nom+brend) material
            if (brand is not null && MatchKey(brand) != MatchKey(material.Brand))
                material = await FindOrCreateMaterialAsync(material.CompanyAdminId, material.Name, brand, material.Unit);
        }

        // UnitPrice/TotalCost har doim so'mda saqlanadi; kurs bugungi CBU kursi
        var currency = Money.Normalize(dto.Currency, "UZS");
        var rate = await Money.CurrentRateAsync(_currencyService);
        var effectiveUnitPrice = Money.ToUzs(dto.UnitPrice, currency, rate);
        var totalCost = Math.Round(dto.Quantity * effectiveUnitPrice, 2);

        var purchase = new MaterialPurchase
        {
            ProjectId = projectId,
            MaterialId = material.Id,
            Quantity = dto.Quantity,
            Unit = material.Unit,
            UnitPrice = effectiveUnitPrice,
            TotalCost = totalCost,
            Currency = currency,
            ExchangeRateToUzs = rate,
            OriginalUnitPrice = dto.UnitPrice,
            Brand = material.Brand,
            Supplier = dto.Supplier?.Trim(),
            PurchaseDate = dto.PurchaseDate,
            ReceiptNumber = dto.ReceiptNumber?.Trim(),
            Notes = dto.Notes?.Trim(),
            CreatedByUserId = createdByUserId,
            CreatedAt = DateTime.UtcNow
        };

        _context.MaterialPurchases.Add(purchase);
        await _context.SaveChangesAsync();

        return new MaterialPurchaseDto
        {
            Id = purchase.Id,
            ProjectId = purchase.ProjectId,
            MaterialId = purchase.MaterialId,
            MaterialName = material.Name,
            Brand = purchase.Brand,
            Quantity = purchase.Quantity,
            Unit = purchase.Unit,
            UnitPrice = purchase.UnitPrice,
            TotalCost = purchase.TotalCost,
            TotalCostUsd = Math.Round(purchase.TotalCost / rate, 2),
            Currency = purchase.Currency,
            ExchangeRateToUzs = purchase.ExchangeRateToUzs,
            OriginalUnitPrice = purchase.OriginalUnitPrice,
            Supplier = purchase.Supplier,
            PurchaseDate = purchase.PurchaseDate,
            ReceiptNumber = purchase.ReceiptNumber,
            Notes = purchase.Notes,
            CreatedByUserId = purchase.CreatedByUserId,
            CreatedByName = user.FullName,
            CreatedAt = purchase.CreatedAt
        };
    }

    public async Task<List<MaterialPurchaseDto>> GetPurchasesByProjectAsync(Guid projectId)
    {
        var projectExists = await _context.Projects.AnyAsync(p => p.Id == projectId);
        if (!projectExists)
            throw new KeyNotFoundException("Loyiha topilmadi.");

        var purchases = await _context.MaterialPurchases
            .Include(mp => mp.Material)
            .Include(mp => mp.CreatedByUser)
            .Where(mp => mp.ProjectId == projectId)
            .OrderByDescending(mp => mp.PurchaseDate)
            .ToListAsync();

        var currentRate = await Money.CurrentRateAsync(_currencyService);
        return purchases.Select(p => new MaterialPurchaseDto
        {
            Id = p.Id,
            ProjectId = p.ProjectId,
            MaterialId = p.MaterialId,
            MaterialName = p.Material?.Name ?? "",
            Brand = p.Brand ?? p.Material?.Brand,
            Quantity = p.Quantity,
            Unit = p.Unit,
            UnitPrice = p.UnitPrice,
            TotalCost = p.TotalCost,
            TotalCostUsd = Math.Round(p.TotalCost / (p.ExchangeRateToUzs is > 0 ? p.ExchangeRateToUzs.Value : currentRate), 2),
            Currency = p.Currency ?? "UZS",
            ExchangeRateToUzs = p.ExchangeRateToUzs,
            OriginalUnitPrice = p.OriginalUnitPrice,
            Supplier = p.Supplier,
            PurchaseDate = p.PurchaseDate,
            ReceiptNumber = p.ReceiptNumber,
            Notes = p.Notes,
            CreatedByUserId = p.CreatedByUserId,
            CreatedByName = p.CreatedByUser?.FullName ?? "",
            CreatedAt = p.CreatedAt
        }).ToList();
    }

    public async Task<MaterialPurchaseDto> GetPurchaseByIdAsync(Guid projectId, Guid purchaseId)
    {
        var purchase = await _context.MaterialPurchases
            .Include(mp => mp.Material)
            .Include(mp => mp.CreatedByUser)
            .FirstOrDefaultAsync(mp => mp.Id == purchaseId && mp.ProjectId == projectId);

        if (purchase is null)
            throw new KeyNotFoundException("Xarid topilmadi.");

        return new MaterialPurchaseDto
        {
            Id = purchase.Id,
            ProjectId = purchase.ProjectId,
            MaterialId = purchase.MaterialId,
            MaterialName = purchase.Material?.Name ?? "",
            Brand = purchase.Brand ?? purchase.Material?.Brand,
            Quantity = purchase.Quantity,
            Unit = purchase.Unit,
            UnitPrice = purchase.UnitPrice,
            TotalCost = purchase.TotalCost,
            Currency = purchase.Currency ?? "UZS",
            ExchangeRateToUzs = purchase.ExchangeRateToUzs,
            OriginalUnitPrice = purchase.OriginalUnitPrice,
            Supplier = purchase.Supplier,
            PurchaseDate = purchase.PurchaseDate,
            ReceiptNumber = purchase.ReceiptNumber,
            Notes = purchase.Notes,
            CreatedByUserId = purchase.CreatedByUserId,
            CreatedByName = purchase.CreatedByUser?.FullName ?? "",
            CreatedAt = purchase.CreatedAt
        };
    }

    public async Task DeletePurchaseAsync(Guid projectId, Guid purchaseId)
    {
        var purchase = await _context.MaterialPurchases
            .FirstOrDefaultAsync(mp => mp.Id == purchaseId && mp.ProjectId == projectId);

        if (purchase is null)
            throw new KeyNotFoundException("Xarid topilmadi.");

        _context.MaterialPurchases.Remove(purchase);
        await _context.SaveChangesAsync();
    }

    public async Task<List<ProjectMaterialSummaryDto>> GetProjectMaterialSummaryAsync(Guid projectId)
    {
        var projectExists = await _context.Projects.AnyAsync(p => p.Id == projectId);
        if (!projectExists)
            throw new KeyNotFoundException("Loyiha topilmadi.");

        var purchases = await _context.MaterialPurchases
            .Include(mp => mp.Material)
            .Where(mp => mp.ProjectId == projectId)
            .ToListAsync();

        var currentRate = await Money.CurrentRateAsync(_currencyService);
        return purchases
            .GroupBy(mp => new { mp.MaterialId, Brand = mp.Brand ?? mp.Material?.Brand, mp.Unit })
            .Select(g => new ProjectMaterialSummaryDto
            {
                MaterialId = g.Key.MaterialId,
                MaterialName = g.First().Material?.Name ?? "",
                Brand = g.Key.Brand,
                Unit = g.Key.Unit,
                TotalQuantity = g.Sum(x => x.Quantity),
                TotalCost = g.Sum(x => x.TotalCost),
                TotalCostUsd = Math.Round(g.Sum(x => ToUsd(x, currentRate)), 2),
                PurchaseCount = g.Count()
            })
            .OrderByDescending(s => s.TotalCost)
            .ToList();
    }

    private static decimal ToUsd(MaterialPurchase p, decimal currentRate)
        => p.TotalCost / (p.ExchangeRateToUzs is > 0 ? p.ExchangeRateToUzs.Value : currentRate);

    public async Task<List<MaterialUsageDto>> GetMaterialUsageAsync(Guid requestingUserId, UserRole requestingUserRole, DateTime? from, DateTime? to)
    {
        var query = _context.MaterialPurchases
            .Include(mp => mp.Material)
            .Include(mp => mp.Project)
            .AsQueryable();

        if (requestingUserRole != UserRole.SuperAdmin)
        {
            var companyAdminId = await ResolveCompanyAdminIdAsync(requestingUserId, requestingUserRole);
            query = query.Where(mp => mp.Project.CompanyAdminId == companyAdminId);
        }
        if (from.HasValue)
        {
            var f = DateTime.SpecifyKind(from.Value.Date, DateTimeKind.Utc);
            query = query.Where(mp => mp.PurchaseDate >= f);
        }
        if (to.HasValue)
        {
            var t = DateTime.SpecifyKind(to.Value.Date.AddDays(1), DateTimeKind.Utc);
            query = query.Where(mp => mp.PurchaseDate < t);
        }

        var purchases = await query.ToListAsync();
        var currentRate = await Money.CurrentRateAsync(_currencyService);

        return purchases
            .GroupBy(mp => new { mp.MaterialId, Brand = mp.Brand ?? mp.Material?.Brand, mp.Unit, mp.ProjectId })
            .Select(g =>
            {
                var qty = g.Sum(x => x.Quantity);
                var cost = g.Sum(x => x.TotalCost);
                var first = g.First();
                return new MaterialUsageDto
                {
                    MaterialId = g.Key.MaterialId,
                    MaterialName = first.Material?.Name ?? "",
                    Brand = g.Key.Brand,
                    Unit = g.Key.Unit,
                    ProjectId = g.Key.ProjectId,
                    ProjectName = first.Project?.Name ?? "",
                    TotalQuantity = qty,
                    TotalCost = cost,
                    TotalCostUsd = Math.Round(g.Sum(x => ToUsd(x, currentRate)), 2),
                    AverageUnitPrice = qty > 0 ? Math.Round(cost / qty, 2) : 0,
                    PurchaseCount = g.Count(),
                    LastPurchaseDate = g.Max(x => x.PurchaseDate)
                };
            })
            .OrderBy(u => u.MaterialName)
            .ThenBy(u => u.Brand)
            .ThenByDescending(u => u.TotalCost)
            .ToList();
    }
}

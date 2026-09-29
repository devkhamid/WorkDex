using Microsoft.EntityFrameworkCore;
using WorkDex.Api.Data;
using WorkDex.Api.DTOs.Materials;
using WorkDex.Api.Models;

namespace WorkDex.Api.Services;

public class MaterialService : IMaterialService
{
    private readonly AppDbContext _context;

    public MaterialService(AppDbContext context)
    {
        _context = context;
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
            .ToListAsync();

        return materials.Select(m => new MaterialDto
        {
            Id = m.Id,
            Name = m.Name,
            Brand = m.Brand,
            Unit = m.Unit,
            Description = m.Description,
            CreatedAt = m.CreatedAt
        }).ToList();
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

        var material = new Material
        {
            Name = dto.Name.Trim(),
            Brand = dto.Brand?.Trim(),
            Unit = dto.Unit.Trim(),
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

        material.Name = dto.Name.Trim();
        material.Brand = dto.Brand?.Trim();
        material.Unit = dto.Unit.Trim();
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

    public async Task<MaterialPurchaseDto> AddPurchaseAsync(Guid projectId, CreateMaterialPurchaseDto dto, Guid createdByUserId)
    {
        var project = await _context.Projects.FindAsync(projectId);
        if (project is null)
            throw new KeyNotFoundException("Loyiha topilmadi.");

        var material = await _context.Materials.FindAsync(dto.MaterialId);
        if (material is null)
            throw new KeyNotFoundException("Material topilmadi.");

        // Material o'z kompaniyasiga tegishli ekanini tekshirish
        if (project.CompanyAdminId != null && material.CompanyAdminId != null && material.CompanyAdminId != project.CompanyAdminId)
            throw new InvalidOperationException("Tanlangan material boshqa kompaniyaga tegishli.");

        var user = await _context.Users.FindAsync(createdByUserId);
        if (user is null)
            throw new KeyNotFoundException("Foydalanuvchi topilmadi.");

        var isUsd = string.Equals(dto.Currency, "USD", StringComparison.OrdinalIgnoreCase) && dto.ExchangeRateToUzs.HasValue && dto.ExchangeRateToUzs.Value > 0;
        var originalPrice = dto.OriginalUnitPrice ?? dto.UnitPrice;
        var effectiveUnitPrice = isUsd ? Math.Round(originalPrice * dto.ExchangeRateToUzs!.Value, 2) : dto.UnitPrice;
        var totalCost = Math.Round(dto.Quantity * effectiveUnitPrice, 2);
        var finalBrand = !string.IsNullOrWhiteSpace(dto.Brand) ? dto.Brand.Trim() : material.Brand;

        var purchase = new MaterialPurchase
        {
            ProjectId = projectId,
            MaterialId = dto.MaterialId,
            Quantity = dto.Quantity,
            Unit = material.Unit,
            UnitPrice = effectiveUnitPrice,
            TotalCost = totalCost,
            Currency = isUsd ? "USD" : "UZS",
            ExchangeRateToUzs = isUsd ? dto.ExchangeRateToUzs : null,
            OriginalUnitPrice = isUsd ? originalPrice : null,
            Brand = finalBrand,
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

        var summary = await _context.MaterialPurchases
            .Include(mp => mp.Material)
            .Where(mp => mp.ProjectId == projectId)
            .GroupBy(mp => new { mp.MaterialId, mp.Material.Name, mp.Material.Brand, mp.Unit })
            .Select(g => new ProjectMaterialSummaryDto
            {
                MaterialId = g.Key.MaterialId,
                MaterialName = g.Key.Name,
                Brand = g.Key.Brand,
                Unit = g.Key.Unit,
                TotalQuantity = g.Sum(x => x.Quantity),
                TotalCost = g.Sum(x => x.TotalCost),
                PurchaseCount = g.Count()
            })
            .OrderByDescending(s => s.TotalCost)
            .ToListAsync();

        return summary;
    }
}

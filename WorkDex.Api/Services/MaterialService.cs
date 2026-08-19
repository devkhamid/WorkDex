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

    public async Task<List<MaterialDto>> GetAllMaterialsAsync()
    {
        var materials = await _context.Materials
            .OrderBy(m => m.Name)
            .ToListAsync();

        return materials.Select(m => new MaterialDto
        {
            Id = m.Id,
            Name = m.Name,
            Unit = m.Unit,
            Description = m.Description,
            CreatedAt = m.CreatedAt
        }).ToList();
    }

    public async Task<MaterialDto> GetMaterialByIdAsync(Guid id)
    {
        var material = await _context.Materials.FindAsync(id);
        if (material is null)
            throw new KeyNotFoundException("Material topilmadi.");

        return new MaterialDto
        {
            Id = material.Id,
            Name = material.Name,
            Unit = material.Unit,
            Description = material.Description,
            CreatedAt = material.CreatedAt
        };
    }

    public async Task<MaterialDto> CreateMaterialAsync(CreateMaterialDto dto)
    {
        var material = new Material
        {
            Name = dto.Name.Trim(),
            Unit = dto.Unit.Trim(),
            Description = dto.Description?.Trim(),
            CreatedAt = DateTime.UtcNow
        };

        _context.Materials.Add(material);
        await _context.SaveChangesAsync();

        return new MaterialDto
        {
            Id = material.Id,
            Name = material.Name,
            Unit = material.Unit,
            Description = material.Description,
            CreatedAt = material.CreatedAt
        };
    }

    public async Task<MaterialDto> UpdateMaterialAsync(Guid id, CreateMaterialDto dto)
    {
        var material = await _context.Materials.FindAsync(id);
        if (material is null)
            throw new KeyNotFoundException("Material topilmadi.");

        material.Name = dto.Name.Trim();
        material.Unit = dto.Unit.Trim();
        material.Description = dto.Description?.Trim();

        await _context.SaveChangesAsync();

        return new MaterialDto
        {
            Id = material.Id,
            Name = material.Name,
            Unit = material.Unit,
            Description = material.Description,
            CreatedAt = material.CreatedAt
        };
    }

    public async Task DeleteMaterialAsync(Guid id)
    {
        var material = await _context.Materials
            .Include(m => m.Purchases)
            .FirstOrDefaultAsync(m => m.Id == id);

        if (material is null)
            throw new KeyNotFoundException("Material topilmadi.");

        if (material.Purchases.Any())
            throw new InvalidOperationException("Ushbu material xaridlarda ishlatilgan, uni o'chirib bo'lmaydi.");

        _context.Materials.Remove(material);
        await _context.SaveChangesAsync();
    }

    public async Task<MaterialPurchaseDto> AddPurchaseAsync(Guid projectId, CreateMaterialPurchaseDto dto, Guid createdByUserId)
    {
        var project = await _context.Projects.FindAsync(projectId);
        if (project is null)
            throw new KeyNotFoundException("Loyiha topilmadi.");

        var material = await _context.Materials.FindAsync(dto.MaterialId);
        if (material is null)
            throw new KeyNotFoundException("Material topilmadi.");

        var user = await _context.Users.FindAsync(createdByUserId);
        if (user is null)
            throw new KeyNotFoundException("Foydalanuvchi topilmadi.");

        var totalCost = Math.Round(dto.Quantity * dto.UnitPrice, 2);

        var purchase = new MaterialPurchase
        {
            ProjectId = projectId,
            MaterialId = dto.MaterialId,
            Quantity = dto.Quantity,
            Unit = material.Unit,
            UnitPrice = dto.UnitPrice,
            TotalCost = totalCost,
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
            Quantity = purchase.Quantity,
            Unit = purchase.Unit,
            UnitPrice = purchase.UnitPrice,
            TotalCost = purchase.TotalCost,
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
            Quantity = p.Quantity,
            Unit = p.Unit,
            UnitPrice = p.UnitPrice,
            TotalCost = p.TotalCost,
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
            Quantity = purchase.Quantity,
            Unit = purchase.Unit,
            UnitPrice = purchase.UnitPrice,
            TotalCost = purchase.TotalCost,
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
            .GroupBy(mp => new { mp.MaterialId, mp.Material.Name, mp.Unit })
            .Select(g => new ProjectMaterialSummaryDto
            {
                MaterialId = g.Key.MaterialId,
                MaterialName = g.Key.Name,
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

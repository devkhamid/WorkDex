using System.Security.Claims;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.ChangeTracking;
using Microsoft.EntityFrameworkCore.Diagnostics;
using WorkDex.Api.Data;
using WorkDex.Api.Models;

namespace WorkDex.Api.Services;

public class NotificationInterceptor : SaveChangesInterceptor
{
    private const int MaxNotificationsPerSave = 3;
    private static readonly HashSet<string> IgnoredProperties = new() { "UpdatedAt", "CreatedAt", "ProgressPercent" };

    private readonly IHttpContextAccessor _httpContextAccessor;
    private readonly ILogger<NotificationInterceptor> _logger;

    public NotificationInterceptor(IHttpContextAccessor httpContextAccessor, ILogger<NotificationInterceptor> logger)
    {
        _httpContextAccessor = httpContextAccessor;
        _logger = logger;
    }

    public override async ValueTask<InterceptionResult<int>> SavingChangesAsync(
        DbContextEventData eventData,
        InterceptionResult<int> result,
        CancellationToken cancellationToken = default)
    {
        if (eventData.Context is AppDbContext context)
        {
            try
            {
                await AddNotificationsAsync(context, cancellationToken);
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Bildirishnoma yaratishda xatolik");
            }
        }
        return await base.SavingChangesAsync(eventData, result, cancellationToken);
    }

    private sealed record Change(EntityEntry Entry, string Type, NotificationAction Action, Guid? ProjectId);

    private async Task AddNotificationsAsync(AppDbContext context, CancellationToken ct)
    {
        var principal = _httpContextAccessor.HttpContext?.User;
        if (principal?.Identity?.IsAuthenticated != true) return;
        if (principal.IsInRole(nameof(UserRole.SuperAdmin)) || principal.IsInRole(nameof(UserRole.Customer))) return;

        var idValue = principal.FindFirstValue("userId") ?? principal.FindFirstValue(ClaimTypes.NameIdentifier);
        if (!Guid.TryParse(idValue, out var actorId)) return;

        var changes = new List<Change>();
        foreach (var entry in context.ChangeTracker.Entries())
        {
            var action = entry.State switch
            {
                EntityState.Added => NotificationAction.Created,
                EntityState.Modified => NotificationAction.Updated,
                EntityState.Deleted => NotificationAction.Deleted,
                _ => (NotificationAction?)null
            };
            if (action is null) continue;

            var type = entry.Entity.GetType().Name;
            if (!Nouns.ContainsKey(type)) continue;

            if (action == NotificationAction.Updated &&
                !entry.Properties.Any(p => p.IsModified && !IgnoredProperties.Contains(p.Metadata.Name)))
                continue;

            Guid? projectId = entry.Entity switch
            {
                Project p => p.Id,
                Expense e => e.ProjectId,
                _ => entry.Metadata.FindProperty("ProjectId") is not null
                    ? entry.Property("ProjectId").CurrentValue as Guid?
                    : null
            };
            changes.Add(new Change(entry, type, action.Value, projectId));
        }
        if (changes.Count == 0) return;

        var projectLifecycle = changes
            .Where(c => c.Type == nameof(Project) && c.Action != NotificationAction.Updated)
            .Select(c => c.ProjectId)
            .ToHashSet();
        changes = changes
            .Where(c => c.Type == nameof(Project) || c.ProjectId is null || !projectLifecycle.Contains(c.ProjectId))
            .ToList();

        var editedProjects = changes
            .Where(c => c.Type == nameof(Project) && c.Action == NotificationAction.Updated)
            .Select(c => c.ProjectId)
            .ToHashSet();
        changes.RemoveAll(c => c.Type == nameof(ProjectStage) && editedProjects.Contains(c.ProjectId));

        if (changes.Any(c => c.Type != nameof(Project)))
            changes.RemoveAll(c => c.Type == nameof(Project) && c.Action == NotificationAction.Updated);
        if (changes.Any(c => c.Type == nameof(MaterialPurchase)))
            changes.RemoveAll(c => c.Type == nameof(Material));
        if (changes.Any(c => c.Type == nameof(Project) && c.Action == NotificationAction.Created))
            changes.RemoveAll(c => c.Type is nameof(Agreement) or nameof(Customer) && c.Action != NotificationAction.Deleted);
        if (changes.Count == 0) return;

        var actor = await context.Users.AsNoTracking()
            .Where(u => u.Id == actorId)
            .Select(u => new { u.Id, u.FirstName, u.LastName, u.CompanyAdminId })
            .FirstOrDefaultAsync(ct);
        if (actor is null) return;
        var companyId = actor.CompanyAdminId ?? actor.Id;
        var actorName = $"{actor.FirstName} {actor.LastName}".Trim();

        var projectNames = await LoadNamesAsync(
            changes.Where(c => c.ProjectId.HasValue).Select(c => c.ProjectId!.Value),
            id => context.Projects.Local.FirstOrDefault(p => p.Id == id)?.Name,
            ids => context.Projects.AsNoTracking().Where(p => ids.Contains(p.Id)).Select(p => new { p.Id, p.Name })
                .ToDictionaryAsync(p => p.Id, p => p.Name, ct));
        var materialNames = await LoadNamesAsync(
            changes.Select(c => c.Entry.Entity).OfType<MaterialPurchase>().Select(m => m.MaterialId),
            id => context.Materials.Local.FirstOrDefault(m => m.Id == id)?.Name,
            ids => context.Materials.AsNoTracking().Where(m => ids.Contains(m.Id)).Select(m => new { m.Id, m.Name })
                .ToDictionaryAsync(m => m.Id, m => m.Name, ct));
        var workerNames = await LoadNamesAsync(
            changes.Select(c => c.Entry.Entity).OfType<WorkerPayment>().Select(w => w.WorkerId),
            id => context.Workers.Local.FirstOrDefault(w => w.Id == id)?.FullName,
            ids => context.Workers.AsNoTracking().Where(w => ids.Contains(w.Id)).Select(w => new { w.Id, w.FullName })
                .ToDictionaryAsync(w => w.Id, w => w.FullName, ct));

        var now = DateTime.UtcNow;
        var groups = changes
            .GroupBy(c => (c.Type, c.Action, c.ProjectId, Office: c.Entry.Entity is Expense { ProjectId: null }))
            .Take(MaxNotificationsPerSave);

        foreach (var g in groups)
        {
            var first = g.First();
            var noun = first.Entry.Entity is Expense { ProjectId: null } ? "Ofis xarajati" : Nouns[first.Type];
            var verb = first.Action switch
            {
                NotificationAction.Created => "qo'shildi",
                NotificationAction.Updated => "o'zgartirildi",
                _ => "o'chirildi"
            };
            var count = g.Count();
            var label = count == 1 ? Label(first.Entry.Entity, materialNames, workerNames) : null;

            var message = count > 1
                ? $"{count} ta {noun.ToLowerInvariant()} {verb}"
                : $"{noun} {verb}";
            if (!string.IsNullOrWhiteSpace(label)) message += $": {Truncate(label, 80)}";
            if (first.Type != nameof(Project) && first.ProjectId is Guid pid && projectNames.TryGetValue(pid, out var pname))
                message += $" — «{Truncate(pname, 60)}»";

            var navigableProject = first.Type == nameof(Project) && first.Action == NotificationAction.Deleted
                ? null
                : first.ProjectId;

            context.Notifications.Add(new Notification
            {
                CompanyAdminId = companyId,
                ActorUserId = actor.Id,
                ActorName = Truncate(actorName, 200),
                Action = first.Action,
                EntityType = first.Type,
                Message = Truncate(message, 500),
                ProjectId = navigableProject,
                CreatedAt = now
            });
        }
    }

    private static async Task<Dictionary<Guid, string>> LoadNamesAsync(
        IEnumerable<Guid> idsSource,
        Func<Guid, string?> fromLocal,
        Func<List<Guid>, Task<Dictionary<Guid, string>>> fromDb)
    {
        var result = new Dictionary<Guid, string>();
        var missing = new List<Guid>();
        foreach (var id in idsSource.Distinct())
        {
            var local = fromLocal(id);
            if (local is not null) result[id] = local;
            else missing.Add(id);
        }
        if (missing.Count > 0)
        {
            foreach (var kv in await fromDb(missing)) result[kv.Key] = kv.Value;
        }
        return result;
    }

    private static readonly Dictionary<string, string> Nouns = new()
    {
        [nameof(Project)] = "Loyiha",
        [nameof(Customer)] = "Mijoz",
        [nameof(Payment)] = "Mijoz to'lovi",
        [nameof(Expense)] = "Xarajat",
        [nameof(Material)] = "Material",
        [nameof(MaterialPurchase)] = "Material xaridi",
        [nameof(Worker)] = "Usta",
        [nameof(WorkerPayment)] = "Usta ishi/to'lovi",
        [nameof(ExtraWork)] = "Qo'shimcha ish",
        [nameof(ProjectTask)] = "Vazifa",
        [nameof(ProjectStage)] = "Bosqich",
        [nameof(ProjectDocument)] = "Hujjat",
        [nameof(ProjectPhoto)] = "Foto",
        [nameof(ProjectUpdate)] = "Izoh",
        [nameof(Agreement)] = "Shartnoma",
        [nameof(User)] = "Xodim",
    };

    private static string? Label(object entity, Dictionary<Guid, string> materials, Dictionary<Guid, string> workers) => entity switch
    {
        Project p => p.Name,
        Customer c => c.FullName,
        Expense e => e.Description,
        Material m => string.IsNullOrWhiteSpace(m.Brand) ? m.Name : $"{m.Name} ({m.Brand})",
        MaterialPurchase mp => materials.TryGetValue(mp.MaterialId, out var mn)
            ? (string.IsNullOrWhiteSpace(mp.Brand) ? mn : $"{mn} ({mp.Brand})")
            : null,
        Worker w => w.FullName,
        WorkerPayment wp => workers.TryGetValue(wp.WorkerId, out var wn) ? wn : wp.JobDescription,
        ExtraWork x => x.Title,
        ProjectTask t => t.Title,
        ProjectStage s => s.Name,
        ProjectDocument d => d.Title,
        ProjectPhoto ph => ph.Caption,
        Agreement a => $"№{a.ContractNumber:000}",
        User u => u.FullName,
        _ => null
    };

    private static string Truncate(string value, int max) =>
        value.Length <= max ? value : value[..(max - 1)] + "…";
}

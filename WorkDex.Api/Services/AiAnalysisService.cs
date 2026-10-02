using System.Globalization;
using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
using System.Text.Json.Nodes;
using Microsoft.EntityFrameworkCore;
using WorkDex.Api.Data;
using WorkDex.Api.Models;

namespace WorkDex.Api.Services;

public interface IAiAnalysisService
{
    bool IsConfigured { get; }
    Task<AiAnalysisResultDto> AnalyzeProjectAsync(Guid projectId, string? question, CancellationToken ct = default);
}

public class AiAnalysisResultDto
{
    public string Analysis { get; set; } = string.Empty;
    public string Model { get; set; } = string.Empty;
    public DateTime GeneratedAt { get; set; }
}

public class AiAnalysisRequestDto
{
    public string? Question { get; set; }
}

/// <summary>
/// Loyiha ma'lumotlarini yig'ib, Groq (OpenAI-mos API) orqali AI tahlil qiladi.
/// API kalit faqat serverda saqlanadi: "Groq:ApiKey" (user-secrets yoki env: Groq__ApiKey).
/// </summary>
public class AiAnalysisService : IAiAnalysisService
{
    private const string GroqUrl = "https://api.groq.com/openai/v1/chat/completions";
    private const string DefaultModel = "openai/gpt-oss-120b";

    private readonly AppDbContext _context;
    private readonly IProjectService _projectService;
    private readonly HttpClient _http;
    private readonly ILogger<AiAnalysisService> _logger;
    private readonly string? _apiKey;
    private readonly string _model;

    public AiAnalysisService(
        AppDbContext context,
        IProjectService projectService,
        IHttpClientFactory httpClientFactory,
        IConfiguration config,
        ILogger<AiAnalysisService> logger)
    {
        _context = context;
        _projectService = projectService;
        _http = httpClientFactory.CreateClient("Groq");
        _logger = logger;
        _apiKey = config["Groq:ApiKey"];
        _model = string.IsNullOrWhiteSpace(config["Groq:Model"]) ? DefaultModel : config["Groq:Model"]!;
    }

    public bool IsConfigured => !string.IsNullOrWhiteSpace(_apiKey);

    public async Task<AiAnalysisResultDto> AnalyzeProjectAsync(Guid projectId, string? question, CancellationToken ct = default)
    {
        if (!IsConfigured)
            throw new InvalidOperationException("AI tahlil sozlanmagan: serverda Groq API kaliti yo'q.");

        var context = await BuildProjectContextAsync(projectId, ct);

        var userPrompt = new StringBuilder();
        userPrompt.AppendLine("Quyida qurilish/ta'mirlash loyihasining barcha ma'lumotlari keltirilgan.");
        userPrompt.AppendLine();
        userPrompt.AppendLine(context);
        userPrompt.AppendLine();
        if (!string.IsNullOrWhiteSpace(question))
        {
            userPrompt.AppendLine("Foydalanuvchining savoli (asosan shunga javob bering, ma'lumotlarga tayangan holda):");
            userPrompt.AppendLine(question.Trim());
        }
        else
        {
            userPrompt.AppendLine("Ushbu loyihani to'liq tahlil qiling.");
        }

        var body = new JsonObject
        {
            ["model"] = _model,
            ["temperature"] = 0.3,
            ["max_completion_tokens"] = 6000,
            ["messages"] = new JsonArray
            {
                new JsonObject { ["role"] = "system", ["content"] = SystemPrompt },
                new JsonObject { ["role"] = "user", ["content"] = userPrompt.ToString() }
            }
        };

        using var req = new HttpRequestMessage(HttpMethod.Post, GroqUrl)
        {
            Content = new StringContent(body.ToJsonString(), Encoding.UTF8, "application/json")
        };
        req.Headers.Authorization = new AuthenticationHeaderValue("Bearer", _apiKey);

        using var res = await _http.SendAsync(req, ct);
        var json = await res.Content.ReadAsStringAsync(ct);
        if (!res.IsSuccessStatusCode)
        {
            _logger.LogError("Groq API xatosi {Status}: {Body}", (int)res.StatusCode, json.Length > 1000 ? json[..1000] : json);
            var msg = (int)res.StatusCode == 429
                ? "AI xizmati limiti tugadi, birozdan keyin qayta urinib ko'ring."
                : $"AI xizmati xatolik qaytardi ({(int)res.StatusCode}).";
            throw new HttpRequestException(msg);
        }

        using var doc = JsonDocument.Parse(json);
        var content = doc.RootElement.GetProperty("choices")[0].GetProperty("message").GetProperty("content").GetString() ?? "";

        return new AiAnalysisResultDto
        {
            Analysis = content.Trim(),
            Model = _model,
            GeneratedAt = DateTime.UtcNow
        };
    }

    private const string SystemPrompt = """
Siz qurilish va ta'mirlash kompaniyasi uchun tajribali loyiha va moliya tahlilchisisiz.
Javobni FAQAT o'zbek tilida (lotin yozuvida) yozing. Formatlash uchun Markdown ishlating (## sarlavhalar, ro'yxatlar, **qalin**, kerak bo'lsa jadval).
Faqat berilgan ma'lumotlarga tayaning, raqamlarni o'ylab topmang. Ma'lumot yetishmasa, buni ochiq ayting.
Pul summalarini asosan USD da, kerak bo'lsa qavs ichida so'mda ko'rsating.

Savol berilmagan bo'lsa, quyidagi bo'limlar bilan to'liq tahlil bering:
## Umumiy holat — loyiha holati, progress, muddat (kechikish xavfi bormi).
## Moliyaviy tahlil — shartnoma, olingan to'lov, qarz, xarajatlar tuzilmasi, foyda/marja, naqd balans, byudjetdan foydalanish.
## Materiallar — eng katta xarajatli materiallar va brendlar, g'ayrioddiy narxlar yoki takrorlar.
## Ustalar va ish haqi — kelishilgan/bajarilgan/to'langan, qarzdorliklar.
## Qo'shimcha xarajatlar va ishlar — ularning foydaga ta'siri.
## Vazifalar va bosqichlar — bajarilish darajasi, muddati o'tganlar.
## Xavflar — aniq raqamlar bilan asosiy xavflar.
## Tavsiyalar — 3–7 ta aniq, amaliy tavsiya.
""";

    private static string F(decimal? v) => (v ?? 0m).ToString("#,0.##", CultureInfo.InvariantCulture);
    private static string D(DateTime? d) => d.HasValue ? d.Value.ToString("yyyy-MM-dd") : "-";

    private static string CategoryName(ExpenseCategory c) => c switch
    {
        ExpenseCategory.Labor => "Ish haqi",
        ExpenseCategory.Material => "Material",
        ExpenseCategory.Transport => "Transport",
        ExpenseCategory.Fuel => "Yoqilg'i",
        ExpenseCategory.Subcontractor => "Subpudratchi",
        ExpenseCategory.Extra => "Qo'shimcha",
        ExpenseCategory.Cleaning => "Tozalash",
        ExpenseCategory.Carrying => "Yuk tashish",
        ExpenseCategory.AdditionalWork => "Mayda ishlar",
        _ => c.ToString()
    };

    private async Task<string> BuildProjectContextAsync(Guid projectId, CancellationToken ct)
    {
        var project = await _context.Projects
            .AsNoTracking()
            .Include(p => p.Customer)
            .FirstOrDefaultAsync(p => p.Id == projectId, ct)
            ?? throw new KeyNotFoundException("Loyiha topilmadi.");

        var summary = await _projectService.GetSummaryAsync(projectId);
        var rate = summary.ExchangeRate is > 0 ? summary.ExchangeRate.Value : 12700m;
        var today = DateTime.UtcNow.Date;

        var sb = new StringBuilder();
        sb.AppendLine($"Bugungi sana: {today:yyyy-MM-dd}");
        sb.AppendLine($"Kurs (1 USD): {F(rate)} so'm");
        sb.AppendLine();

        sb.AppendLine("# LOYIHA");
        sb.AppendLine($"Nomi: {project.Name}");
        sb.AppendLine($"Mijoz: {project.Customer?.FullName}");
        sb.AppendLine($"Turi: {project.ProjectType ?? "-"}; Manzil: {project.Location ?? "-"}; Blok: {project.Block ?? "-"}; Kvartira: {project.ApartmentNumber ?? "-"}; Maydon: {(project.AreaM2.HasValue ? F(project.AreaM2.Value) + " m²" : "-")}");
        sb.AppendLine($"Holat: {project.Status}; Progress: {F(project.ProgressPercent)}%");
        sb.AppendLine($"Boshlanish: {D(project.StartDate)}; Rejadagi tugash: {D(project.EndDate)}; Haqiqiy tugash: {D(project.ActualEndDate)}");
        sb.AppendLine($"To'lov bosqichlari: oldindan {project.PrepaymentPercent}%, oraliq {project.IntermediatePercent}%, yakuniy {project.FinalPercent}%");
        if (!string.IsNullOrWhiteSpace(project.Description)) sb.AppendLine($"Tavsif: {project.Description}");
        if (!string.IsNullOrWhiteSpace(project.Notes)) sb.AppendLine($"Izoh: {project.Notes}");
        sb.AppendLine();

        sb.AppendLine("# MOLIYAVIY XULOSA (USD; qavsda so'm)");
        sb.AppendLine($"Shartnoma (qo'shimcha ishlar bilan): {F(summary.ContractAmount)} ({F(summary.ContractAmountUzs)})");
        sb.AppendLine($"Byudjet: {F(project.Budget)}; Byudjetdan foydalanish: {F(summary.BudgetUtilizationPercent)}%; Qolgan byudjet: {F(summary.RemainingBudget)}");
        sb.AppendLine($"Olingan to'lov: {F(summary.TotalPaid)} ({F(summary.TotalPaidUzs)})");
        sb.AppendLine($"Mijoz qarzi: {F(summary.RemainingPayment)} ({F(summary.RemainingPaymentUzs)})");
        sb.AppendLine($"Material xarajatlari: {F(summary.MaterialExpenses)} ({F(summary.MaterialExpensesUzs)})");
        sb.AppendLine($"Ish haqi xarajatlari: {F(summary.LaborExpenses)} ({F(summary.LaborExpensesUzs)})");
        sb.AppendLine($"Boshqa xarajatlar: {F(summary.OtherExpenses)} ({F(summary.OtherExpensesUzs)})");
        sb.AppendLine($"Qo'shimcha ishlar: daromad {F(summary.ExtraWorkIncome)}, tannarx {F(summary.ExtraWorkCost)}");
        sb.AppendLine($"Jami xarajat: {F(summary.TotalExpenses)} ({F(summary.TotalExpensesUzs)})");
        sb.AppendLine($"Kutilayotgan yalpi foyda: {F(summary.GrossProfit)} ({F(summary.GrossProfitUzs)})");
        sb.AppendLine($"Naqd balans (olingan − xarajat): {F(summary.NetBalance)} ({F(summary.NetBalanceUzs)})");
        sb.AppendLine();

        var payments = await _context.Payments.AsNoTracking()
            .Where(p => p.ProjectId == projectId)
            .OrderBy(p => p.PaymentDate)
            .ToListAsync(ct);
        sb.AppendLine($"# MIJOZ TO'LOVLARI ({payments.Count} ta)");
        foreach (var p in payments.TakeLast(60))
            sb.AppendLine($"- {D(p.PaymentDate)}: {F(p.Amount)} USD ({p.PaymentMethod}){(string.IsNullOrWhiteSpace(p.Notes) ? "" : " — " + p.Notes)}");
        sb.AppendLine();

        var purchases = await _context.MaterialPurchases.AsNoTracking()
            .Include(mp => mp.Material)
            .Where(mp => mp.ProjectId == projectId)
            .ToListAsync(ct);
        sb.AppendLine($"# MATERIALLAR (material + brend bo'yicha jamlangan, so'mda; {purchases.Count} ta xarid)");
        var matGroups = purchases
            .GroupBy(mp => new
            {
                Name = mp.Material?.Name ?? "?",
                Brand = string.IsNullOrWhiteSpace(mp.Brand) ? (mp.Material?.Brand ?? "-") : mp.Brand!,
                mp.Unit
            })
            .Select(g => new
            {
                g.Key.Name,
                g.Key.Brand,
                g.Key.Unit,
                Qty = g.Sum(x => x.Quantity),
                Total = g.Sum(x => x.TotalCost),
                MinPrice = g.Min(x => x.UnitPrice),
                MaxPrice = g.Max(x => x.UnitPrice),
                Count = g.Count(),
                Suppliers = string.Join(", ", g.Select(x => x.Supplier).Where(s => !string.IsNullOrWhiteSpace(s)).Distinct().Take(5))
            })
            .OrderByDescending(x => x.Total)
            .ToList();
        foreach (var m in matGroups.Take(80))
            sb.AppendLine($"- {m.Name} [{m.Brand}]: {F(m.Qty)} {m.Unit}, jami {F(m.Total)} so'm (~{F(Math.Round(m.Total / rate, 2))} USD), narx {F(m.MinPrice)}–{F(m.MaxPrice)}, {m.Count} xarid{(m.Suppliers.Length > 0 ? ", yetkazuvchi: " + m.Suppliers : "")}");
        if (matGroups.Count > 80) sb.AppendLine($"... yana {matGroups.Count - 80} ta material guruhi");
        if (purchases.Count > 0)
            sb.AppendLine($"Xaridlar davri: {D(purchases.Min(p => p.PurchaseDate))} — {D(purchases.Max(p => p.PurchaseDate))}");
        sb.AppendLine();

        var workerJobs = await _context.WorkerPayments.AsNoTracking()
            .Include(w => w.Worker)
            .Where(w => w.ProjectId == projectId)
            .ToListAsync(ct);
        sb.AppendLine($"# USTALAR VA ISHLAR (so'mda; {workerJobs.Count} ta ish)");
        foreach (var g in workerJobs.GroupBy(w => new { w.WorkerId, Name = w.Worker?.FullName ?? "?", Spec = w.Worker?.Specialty }))
        {
            var agreed = g.Sum(x => x.AgreedAmount);
            var done = g.Sum(x => x.WorkAmount);
            var paid = g.Sum(x => x.PaidAmount);
            sb.AppendLine($"- {g.Key.Name}{(string.IsNullOrWhiteSpace(g.Key.Spec) ? "" : " (" + g.Key.Spec + ")")}: kelishilgan {F(agreed)}, bajarilgan {F(done)}, to'langan {F(paid)}, qarz (bajarilgan − to'langan) {F(done - paid)}");
            foreach (var j in g.Take(15))
                sb.AppendLine($"    • {j.JobDescription}: kelishilgan {F(j.AgreedAmount)}, bajarilgan {F(j.WorkAmount)}, to'langan {F(j.PaidAmount)}");
        }
        sb.AppendLine();

        var expenses = await _context.Expenses.AsNoTracking()
            .Where(e => e.ProjectId == projectId)
            .OrderBy(e => e.ExpenseDate)
            .ToListAsync(ct);
        sb.AppendLine($"# QO'SHIMCHA XARAJATLAR (so'mda; {expenses.Count} ta)");
        foreach (var g in expenses.GroupBy(e => e.Category).OrderByDescending(g => g.Sum(x => x.Amount)))
            sb.AppendLine($"- {CategoryName(g.Key)}: {F(g.Sum(x => x.Amount))} ({g.Count()} ta)");
        foreach (var e in expenses.OrderByDescending(e => e.Amount).Take(25))
            sb.AppendLine($"    • {D(e.ExpenseDate)} {CategoryName(e.Category)}: {e.Description} — {F(e.Amount)}");
        sb.AppendLine();

        var extraWorks = await _context.ExtraWorks.AsNoTracking()
            .Where(x => x.ProjectId == projectId)
            .ToListAsync(ct);
        sb.AppendLine($"# QO'SHIMCHA ISHLAR (USD; {extraWorks.Count} ta)");
        foreach (var x in extraWorks.Take(40))
            sb.AppendLine($"- {x.Title}: mijozga {F(x.CustomerAmount)}, tannarx {F(x.ActualCost)}, {(x.IsApprovedByCustomer ? "tasdiqlangan" : "TASDIQLANMAGAN")}");
        sb.AppendLine();

        var stages = await _context.ProjectStages.AsNoTracking()
            .Where(s => s.ProjectId == projectId)
            .OrderBy(s => s.OrderIndex)
            .ToListAsync(ct);
        var tasks = await _context.Tasks.AsNoTracking()
            .Where(t => t.ProjectId == projectId)
            .ToListAsync(ct);
        sb.AppendLine($"# BOSQICHLAR ({stages.Count} ta) VA VAZIFALAR ({tasks.Count} ta, bajarilgan {tasks.Count(t => t.IsCompleted)})");
        foreach (var s in stages)
        {
            var st = tasks.Where(t => t.StageId == s.Id).ToList();
            sb.AppendLine($"- Bosqich: {s.Name} — {(s.IsCompleted ? "yakunlangan " + D(s.CompletedAt) : "jarayonda")}, vazifalar {st.Count(t => t.IsCompleted)}/{st.Count}");
        }
        var overdue = tasks.Where(t => !t.IsCompleted && t.DueDate.HasValue && t.DueDate.Value.Date < today).ToList();
        sb.AppendLine($"Muddati o'tgan vazifalar: {overdue.Count} ta");
        foreach (var t in tasks.OrderBy(t => t.IsCompleted).ThenBy(t => t.DueDate).Take(60))
            sb.AppendLine($"- [{(t.IsCompleted ? "x" : " ")}] {t.Title} (og'irlik {t.Weight}, muddat {D(t.DueDate)}{(t.IsCompleted ? ", bajarildi " + D(t.CompletedAt) : "")})");
        sb.AppendLine();

        var updates = await _context.ProjectUpdates.AsNoTracking()
            .Where(u => u.ProjectId == projectId)
            .OrderByDescending(u => u.CreatedAt)
            .Take(15)
            .ToListAsync(ct);
        if (updates.Count > 0)
        {
            sb.AppendLine("# SO'NGGI YANGILANISHLAR");
            foreach (var u in updates)
                sb.AppendLine($"- {D(u.CreatedAt)}: {u.Message}");
        }

        return sb.ToString();
    }
}

using System.Text.Json;
using System.Collections.Concurrent;
using System.Globalization;
using WorkDex.Api.DTOs.Currency;

namespace WorkDex.Api.Services;

public interface ICurrencyService
{
        Task<decimal> GetUsdToUzsRateAsync();

        Task<IReadOnlyList<CurrencyRateHistoryPointDto>> GetUsdToUzsHistoryAsync(
        int days,
        CancellationToken cancellationToken = default);

        Task<decimal> ConvertUzsToUsdAsync(decimal amountInUzs);
}

public class CurrencyService : ICurrencyService
{
    private readonly HttpClient _httpClient;
    private readonly ILogger<CurrencyService> _logger;

    private static decimal _cachedRate = 12700m;    private static DateTime _cacheDate = DateTime.MinValue;
    private static readonly SemaphoreSlim _lock = new(1, 1);
    private static readonly ConcurrentDictionary<DateOnly, CurrencyRateHistoryPointDto> _historyCache = new();

    private const string CbuApiUrl = "https://cbu.uz/en/arkhiv-kursov-valyut/json/USD/";

    public CurrencyService(IHttpClientFactory httpClientFactory, ILogger<CurrencyService> logger)
    {
        _httpClient = httpClientFactory.CreateClient("CBU");
        _logger = logger;
    }

    public async Task<decimal> GetUsdToUzsRateAsync()
    {
        if (_cacheDate.Date == DateTime.UtcNow.Date && _cachedRate > 0)
            return _cachedRate;

        await _lock.WaitAsync();
        try
        {
            if (_cacheDate.Date == DateTime.UtcNow.Date && _cachedRate > 0)
                return _cachedRate;

            var rate = await FetchRateFromCbuAsync();
            if (rate > 0)
            {
                _cachedRate = rate;
                _cacheDate = DateTime.UtcNow;
                _logger.LogInformation("CBU kursi yangilandi: 1 USD = {Rate} UZS", rate);
            }
            else
            {
                _logger.LogWarning("CBU kursini olishda muammo. Avvalgi kurs ishlatiladi: {Rate}", _cachedRate);
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "CBU API ga ulanishda xatolik. Zaxira kurs: {Rate}", _cachedRate);
        }
        finally
        {
            _lock.Release();
        }

        return _cachedRate;
    }

    public async Task<decimal> ConvertUzsToUsdAsync(decimal amountInUzs)
    {
        var rate = await GetUsdToUzsRateAsync();
        if (rate <= 0) return 0;
        return Math.Round(amountInUzs / rate, 2);
    }

    public async Task<IReadOnlyList<CurrencyRateHistoryPointDto>> GetUsdToUzsHistoryAsync(
        int days,
        CancellationToken cancellationToken = default)
    {
        var stepDays = days <= 31 ? 1 : days <= 90 ? 2 : days <= 180 ? 3 : 7;
        var today = DateOnly.FromDateTime(DateTime.UtcNow.AddHours(5));
        var start = today.AddDays(-days + 1);
        var dates = new List<DateOnly>();

        for (var date = start; date <= today; date = date.AddDays(stepDays))
            dates.Add(date);
        if (dates[^1] != today)
            dates.Add(today);

        var points = new ConcurrentBag<CurrencyRateHistoryPointDto>();
        await Parallel.ForEachAsync(
            dates,
            new ParallelOptions { MaxDegreeOfParallelism = 6, CancellationToken = cancellationToken },
            async (date, token) =>
            {
                if (_historyCache.TryGetValue(date, out var cachedPoint))
                {
                    points.Add(cachedPoint);
                    return;
                }

                var point = await FetchHistoricalRateAsync(date, token);
                _historyCache.TryAdd(date, point);
                points.Add(point);
            });

        return points
            .DistinctBy(point => point.Date)
            .OrderBy(point => point.Date)
            .ToArray();
    }

    private async Task<CurrencyRateHistoryPointDto> FetchHistoricalRateAsync(DateOnly requestedDate, CancellationToken cancellationToken)
    {
        var url = $"{CbuApiUrl}{requestedDate:yyyy-MM-dd}/";
        var json = await _httpClient.GetStringAsync(url, cancellationToken);
        using var doc = JsonDocument.Parse(json);
        var root = doc.RootElement;

        if (root.ValueKind != JsonValueKind.Array || root.GetArrayLength() == 0)
            throw new InvalidOperationException($"CBU tarixiy kursi topilmadi: {requestedDate:yyyy-MM-dd}");

        var entry = root[0];
        if (!entry.TryGetProperty("Rate", out var rateElement)
            || !decimal.TryParse(rateElement.GetString(), NumberStyles.Any, CultureInfo.InvariantCulture, out var rate)
            || rate <= 0)
        {
            throw new InvalidOperationException($"CBU tarixiy kursi noto'g'ri formatda: {requestedDate:yyyy-MM-dd}");
        }

        if (!entry.TryGetProperty("Date", out var dateElement)
            || !DateOnly.TryParseExact(dateElement.GetString(), "dd.MM.yyyy", CultureInfo.InvariantCulture, DateTimeStyles.None, out var effectiveDate))
        {
            throw new InvalidOperationException($"CBU tarixiy sanasi noto'g'ri formatda: {requestedDate:yyyy-MM-dd}");
        }

        return new CurrencyRateHistoryPointDto(effectiveDate, rate);
    }

    private async Task<decimal> FetchRateFromCbuAsync()
    {
        try
        {
            var json = await _httpClient.GetStringAsync(CbuApiUrl);

            using var doc = JsonDocument.Parse(json);
            var root = doc.RootElement;

            if (root.ValueKind == JsonValueKind.Array && root.GetArrayLength() > 0)
            {
                var first = root[0];
                if (first.TryGetProperty("Rate", out var rateProp))
                {
                    var rateStr = rateProp.GetString() ?? "";
                    if (decimal.TryParse(rateStr, System.Globalization.NumberStyles.Any,
                        System.Globalization.CultureInfo.InvariantCulture, out var rate))
                    {
                        return rate;
                    }
                }
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "CBU API javobini tahlil qilishda xatolik");
        }
        return 0;
    }
}

using System.Text.Json;

namespace WorkDex.Api.Services;

/// <summary>
/// O'zbekiston Markaziy Banki (CBU) kurs ma'lumotlarini olish va kunlik kesh qilish.
/// </summary>
public interface ICurrencyService
{
    /// <summary>
    /// Bugungi USD → UZS kursini qaytaradi (1 USD = ? UZS).
    /// Agar CBU API javob bermasa, avvalgi keshlangan qiymat qaytariladi.
    /// </summary>
    Task<decimal> GetUsdToUzsRateAsync();

    /// <summary>
    /// UZS summasini USD ga o'giradi.
    /// </summary>
    Task<decimal> ConvertUzsToUsdAsync(decimal amountInUzs);
}

public class CurrencyService : ICurrencyService
{
    private readonly HttpClient _httpClient;
    private readonly ILogger<CurrencyService> _logger;

    // Kunlik kesh: sanasi + kurs
    private static decimal _cachedRate = 12700m; // Zaxira kurs (agar internet yo'q bo'lsa)
    private static DateTime _cacheDate = DateTime.MinValue;
    private static readonly SemaphoreSlim _lock = new(1, 1);

    private const string CbuApiUrl = "https://cbu.uz/en/arkhiv-kursov-valyut/json/USD/";

    public CurrencyService(IHttpClientFactory httpClientFactory, ILogger<CurrencyService> logger)
    {
        _httpClient = httpClientFactory.CreateClient("CBU");
        _logger = logger;
    }

    public async Task<decimal> GetUsdToUzsRateAsync()
    {
        // Agar bugun kesh yangilangan bo'lsa, to'g'ridan-to'g'ri qaytaramiz
        if (_cacheDate.Date == DateTime.UtcNow.Date && _cachedRate > 0)
            return _cachedRate;

        await _lock.WaitAsync();
        try
        {
            // Double-check locking
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

    private async Task<decimal> FetchRateFromCbuAsync()
    {
        try
        {
            _httpClient.Timeout = TimeSpan.FromSeconds(8);
            var json = await _httpClient.GetStringAsync(CbuApiUrl);

            // CBU API JSON formati: [{"id":"...", "Code":"USD", "Ccy":"USD", "Rate":"12737.55", ...}]
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

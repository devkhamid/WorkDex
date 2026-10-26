namespace WorkDex.Api.Services;

public static class Money
{
    public const decimal FallbackRate = 12700m;

    public static string Normalize(string? currency, string defaultCurrency = "UZS")
    {
        if (string.IsNullOrWhiteSpace(currency)) return defaultCurrency;
        var c = currency.Trim().ToUpperInvariant();
        return c == "USD" || c == "UZS" ? c : throw new InvalidOperationException("Valyuta faqat UZS yoki USD bo'lishi mumkin.");
    }

    public static async Task<decimal> CurrentRateAsync(ICurrencyService currencyService)
    {
        var rate = await currencyService.GetUsdToUzsRateAsync();
        return rate > 0 ? rate : FallbackRate;
    }

    public static decimal ToUzs(decimal amount, string currency, decimal rate) =>
        currency == "USD" ? Math.Round(amount * rate, 2) : amount;

    public static decimal ToUsd(decimal amount, string currency, decimal rate) =>
        currency == "UZS" ? Math.Round(amount / rate, 2) : amount;
}

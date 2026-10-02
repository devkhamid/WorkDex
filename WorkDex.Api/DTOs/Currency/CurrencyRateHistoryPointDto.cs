namespace WorkDex.Api.DTOs.Currency;

public sealed record CurrencyRateHistoryPointDto(DateOnly Date, decimal Rate);

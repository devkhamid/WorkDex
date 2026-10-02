using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using WorkDex.Api.Services;

namespace WorkDex.Api.Controllers;

[ApiController]
[Route("api/currency")]
public class CurrencyController : ControllerBase
{
    private readonly ICurrencyService _currencyService;

    public CurrencyController(ICurrencyService currencyService)
    {
        _currencyService = currencyService;
    }

    [HttpGet("rate")]
    public async Task<IActionResult> GetRate()
    {
        var rate = await _currencyService.GetUsdToUzsRateAsync();
        return Ok(new
        {
            rate,
            currency = "USD",
            toCurrency = "UZS",
            date = DateTime.UtcNow.ToString("yyyy-MM-dd")
        });
    }

    [HttpGet("history")]
    public async Task<IActionResult> GetHistory([FromQuery] int days = 365, CancellationToken cancellationToken = default)
    {
        if (days is not (30 or 90 or 180 or 365))
            return BadRequest(new { message = "Davr 30, 90, 180 yoki 365 kun bo'lishi kerak." });

        var points = await _currencyService.GetUsdToUzsHistoryAsync(days, cancellationToken);
        return Ok(points);
    }
}

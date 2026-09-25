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
}

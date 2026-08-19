using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using WorkDex.Api.DTOs.Payments;
using WorkDex.Api.Helpers;
using WorkDex.Api.Services;

namespace WorkDex.Api.Controllers;

[ApiController]
[Route("api/projects/{projectId:guid}/payments")]
[Authorize]
public class PaymentsController : ControllerBase
{
    private readonly IPaymentService _paymentService;

    public PaymentsController(IPaymentService paymentService)
    {
        _paymentService = paymentService;
    }

    [HttpGet]
    [Authorize(Roles = "Admin,Finance,ProjectManager")]
    public async Task<IActionResult> GetPayments(Guid projectId)
    {
        try
        {
            var payments = await _paymentService.GetPaymentsByProjectAsync(projectId);
            return Ok(payments);
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
    }

    [HttpGet("{paymentId:guid}")]
    [Authorize(Roles = "Admin,Finance,ProjectManager")]
    public async Task<IActionResult> GetPaymentById(Guid projectId, Guid paymentId)
    {
        try
        {
            var payment = await _paymentService.GetPaymentByIdAsync(projectId, paymentId);
            return Ok(payment);
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
    }

    [HttpPost]
    [Authorize(Roles = "Admin,Finance")]
    public async Task<IActionResult> AddPayment(Guid projectId, [FromBody] CreatePaymentDto dto)
    {
        try
        {
            var userId = User.GetUserId();
            var payment = await _paymentService.AddPaymentAsync(projectId, dto, userId);
            return CreatedAtAction(nameof(GetPaymentById), new { projectId, paymentId = payment.Id }, payment);
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
    }

    [HttpDelete("{paymentId:guid}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> DeletePayment(Guid projectId, Guid paymentId)
    {
        try
        {
            await _paymentService.DeletePaymentAsync(projectId, paymentId);
            return NoContent();
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
    }
}

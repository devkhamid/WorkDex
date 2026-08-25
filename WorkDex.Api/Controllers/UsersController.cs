using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using WorkDex.Api.DTOs.Users;
using WorkDex.Api.Helpers;
using WorkDex.Api.Models;
using WorkDex.Api.Services;

namespace WorkDex.Api.Controllers;

[ApiController]
[Route("api/users")]
[Authorize] // Barcha endpointlar uchun login talab qilinadi
public class UsersController : ControllerBase
{
    private readonly IUserService _userService;

    public UsersController(IUserService userService)
    {
        _userService = userService;
    }

    // Har qanday login qilgan foydalanuvchi o'z ma'lumotlarini ko'ra oladi
    [HttpGet("me")]
    public async Task<IActionResult> GetMe()
    {
        try
        {
            var userId = User.GetUserId();
            var result = await _userService.GetCurrentUserAsync(userId);
            return Ok(result);
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
    }

    // SuperAdmin va Admin barcha foydalanuvchilarni ko'ra oladi
    [HttpGet]
    [Authorize(Roles = "SuperAdmin,Admin")]
    public async Task<IActionResult> GetAll()
    {
        var users = await _userService.GetAllUsersAsync(User.GetUserId(), User.GetUserRole());
        return Ok(users);
    }

    // SuperAdmin va Admin bitta foydalanuvchini ko'ra oladi
    [HttpGet("{id:guid}")]
    [Authorize(Roles = "SuperAdmin,Admin")]
    public async Task<IActionResult> GetById(Guid id)
    {
        try
        {
            var user = await _userService.GetUserByIdAsync(id, User.GetUserId(), User.GetUserRole());
            return Ok(user);
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
    }

    // SuperAdmin va Admin foydalanuvchini tahrirlaydi
    [HttpPut("{id:guid}")]
    [Authorize(Roles = "SuperAdmin,Admin")]
    public async Task<IActionResult> Update(Guid id, [FromBody] UpdateUserDto dto)
    {
        try
        {
            var result = await _userService.UpdateUserAsync(id, dto, User.GetUserId(), User.GetUserRole());
            return Ok(result);
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
    }

    // SuperAdmin va Admin hisobni faollashtiradi yoki to'xtatadi
    [HttpPatch("{id:guid}/toggle-active")]
    [Authorize(Roles = "SuperAdmin,Admin")]
    public async Task<IActionResult> ToggleActive(Guid id)
    {
        try
        {
            var result = await _userService.ToggleActiveAsync(id, User.GetUserId(), User.GetUserRole());
            var status = result.IsActive ? "faollashtirildi" : "to'xtatildi";
            return Ok(new { message = $"Hisob {status}.", user = result });
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
    }

    // SuperAdmin foydalanuvchini butunlay o'chiradi
    [HttpDelete("{id:guid}")]
    [Authorize(Roles = "SuperAdmin")]
    public async Task<IActionResult> Delete(Guid id)
    {
        try
        {
            await _userService.DeleteUserAsync(id);
            return Ok(new { message = "Foydalanuvchi muvaffaqiyatli o'chirildi." });
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }
}

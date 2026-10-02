using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using WorkDex.Api.DTOs.Materials;
using WorkDex.Api.Helpers;
using WorkDex.Api.Models;
using WorkDex.Api.Services;

namespace WorkDex.Api.Controllers;

[ApiController]
[Route("api/materials")]
[Authorize]
public class MaterialsController : ControllerBase
{
    private readonly IMaterialService _materialService;

    public MaterialsController(IMaterialService materialService)
    {
        _materialService = materialService;
    }

    [HttpGet]
    [Authorize(Roles = "SuperAdmin,Admin,Finance,ProjectManager,FieldWorker")]
    public async Task<IActionResult> GetAll()
    {
        var materials = await _materialService.GetAllMaterialsAsync(User.GetUserId(), User.GetUserRole());
        return Ok(materials);
    }

    [HttpGet("usage")]
    [Authorize(Roles = "SuperAdmin,Admin,Finance,ProjectManager")]
    public async Task<IActionResult> GetUsage([FromQuery] DateTime? from, [FromQuery] DateTime? to)
    {
        var usage = await _materialService.GetMaterialUsageAsync(User.GetUserId(), User.GetUserRole(), from, to);
        return Ok(usage);
    }

    [HttpGet("{id:guid}")]
    [Authorize(Roles = "SuperAdmin,Admin,Finance,ProjectManager,FieldWorker")]
    public async Task<IActionResult> GetById(Guid id)
    {
        try
        {
            var material = await _materialService.GetMaterialByIdAsync(id, User.GetUserId(), User.GetUserRole());
            return Ok(material);
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
    }

    [HttpPost]
    [Authorize(Roles = "SuperAdmin,Admin,ProjectManager,Finance")]
    public async Task<IActionResult> Create([FromBody] CreateMaterialDto dto)
    {
        try
        {
            var material = await _materialService.CreateMaterialAsync(dto, User.GetUserId());
            return CreatedAtAction(nameof(GetById), new { id = material.Id }, material);
        }
        catch (InvalidOperationException ex)
        {
            return Conflict(new { message = ex.Message });
        }
    }

    [HttpPut("{id:guid}")]
    [Authorize(Roles = "Admin,ProjectManager,Finance")]
    public async Task<IActionResult> Update(Guid id, [FromBody] CreateMaterialDto dto)
    {
        try
        {
            var material = await _materialService.UpdateMaterialAsync(id, dto, User.GetUserId(), User.GetUserRole());
            return Ok(material);
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
        catch (InvalidOperationException ex)
        {
            return Conflict(new { message = ex.Message });
        }
    }

    [HttpPost("{id:guid}/merge")]
    [Authorize(Roles = "SuperAdmin,Admin")]
    public async Task<IActionResult> Merge(Guid id, [FromBody] MergeMaterialDto dto)
    {
        try
        {
            var material = await _materialService.MergeMaterialAsync(id, dto.TargetId, User.GetUserId(), User.GetUserRole());
            return Ok(material);
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

    [HttpDelete("{id:guid}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Delete(Guid id)
    {
        try
        {
            await _materialService.DeleteMaterialAsync(id, User.GetUserId(), User.GetUserRole());
            return NoContent();
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
        catch (InvalidOperationException ex)
        {
            return Conflict(new { message = ex.Message });
        }
    }
}

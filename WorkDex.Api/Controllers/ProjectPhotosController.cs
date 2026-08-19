using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using WorkDex.Api.DTOs.Photos;
using WorkDex.Api.Helpers;
using WorkDex.Api.Services;

namespace WorkDex.Api.Controllers;

[ApiController]
[Route("api/projects/{projectId:guid}/photos")]
[Authorize]
public class ProjectPhotosController : ControllerBase
{
    private readonly IProjectMediaService _mediaService;

    public ProjectPhotosController(IProjectMediaService mediaService)
    {
        _mediaService = mediaService;
    }

    [HttpGet]
    [Authorize(Roles = "Admin,Finance,ProjectManager,FieldWorker,Customer")]
    public async Task<IActionResult> GetPhotos(Guid projectId, [FromQuery] bool onlyCustomerVisible = false)
    {
        try
        {
            var isCustomer = User.IsInRole("Customer");
            var photos = await _mediaService.GetPhotosAsync(projectId, isCustomer || onlyCustomerVisible);
            return Ok(photos);
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
    }

    [HttpPost]
    [Authorize(Roles = "Admin,ProjectManager,FieldWorker")]
    public async Task<IActionResult> AddPhoto(Guid projectId, [FromBody] CreatePhotoDto dto)
    {
        try
        {
            var userId = User.GetUserId();
            var photo = await _mediaService.AddPhotoAsync(projectId, dto, userId);
            return Ok(photo);
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
    }

    [HttpDelete("{photoId:guid}")]
    [Authorize(Roles = "Admin,ProjectManager")]
    public async Task<IActionResult> DeletePhoto(Guid projectId, Guid photoId)
    {
        try
        {
            await _mediaService.DeletePhotoAsync(projectId, photoId);
            return NoContent();
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
    }
}

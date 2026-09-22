using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using WorkDex.Api.DTOs.Documents;
using WorkDex.Api.Helpers;
using WorkDex.Api.Services;

namespace WorkDex.Api.Controllers;

[ApiController]
[Route("api/projects/{projectId:guid}/documents")]
[Authorize]
public class ProjectDocumentsController : ControllerBase
{
    private readonly IProjectMediaService _mediaService;

    public ProjectDocumentsController(IProjectMediaService mediaService)
    {
        _mediaService = mediaService;
    }

    [HttpGet]
    [Authorize(Roles = "SuperAdmin,Admin,Finance,ProjectManager,FieldWorker")]
    public async Task<IActionResult> GetDocuments(Guid projectId)
    {
        try
        {
            var docs = await _mediaService.GetDocumentsAsync(projectId);
            return Ok(docs);
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
    }

    [HttpPost]
    [Authorize(Roles = "SuperAdmin,Admin,Finance,ProjectManager")]
    public async Task<IActionResult> AddDocument(Guid projectId, [FromBody] CreateDocumentDto dto)
    {
        try
        {
            var userId = User.GetUserId();
            var doc = await _mediaService.AddDocumentAsync(projectId, dto, userId);
            return Ok(doc);
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
    }

    [HttpPost("upload")]
    [Authorize(Roles = "SuperAdmin,Admin,Finance,ProjectManager")]
    [Consumes("multipart/form-data")]
    [DisableRequestSizeLimit]
    public async Task<IActionResult> UploadDocument(
        Guid projectId,
        [FromForm] UploadDocumentDto dto)
    {
        try
        {
            var userId = User.GetUserId();
            var doc = await _mediaService.UploadDocumentAsync(projectId, dto.File, dto.Title, dto.FileType, userId);
            return Ok(doc);
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
    }

    [HttpDelete("{documentId:guid}")]
    [Authorize(Roles = "SuperAdmin,Admin,ProjectManager")]
    public async Task<IActionResult> DeleteDocument(Guid projectId, Guid documentId)
    {
        try
        {
            await _mediaService.DeleteDocumentAsync(projectId, documentId);
            return NoContent();
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
    }
}

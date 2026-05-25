using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using VietStore.Data;

namespace VietStore.Controllers;

[ApiController]
[Route("api/categories")]
public class CategoriesController : ControllerBase
{
    private readonly VietStoreDbContext _dbContext;

    public CategoriesController(VietStoreDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    [HttpGet]
    public async Task<IActionResult> GetCategories()
    {
        var categories = await _dbContext.DanhMuc
            .Select(x => new { x.MaDanhMuc, x.TenDanhMuc, x.MaDanhMucCha })
            .ToListAsync();

        return Ok(categories);
    }

    [HttpGet("{maDanhMuc}")]
    public async Task<IActionResult> GetCategory(string maDanhMuc)
    {
        var category = await _dbContext.DanhMuc
            .Where(x => x.MaDanhMuc == maDanhMuc)
            .Select(x => new { x.MaDanhMuc, x.TenDanhMuc, x.MaDanhMucCha })
            .FirstOrDefaultAsync();

        return category is null ? NotFound() : Ok(category);
    }

    [HttpPost]
    public async Task<IActionResult> CreateCategory([FromBody] CreateCategoryRequest request)
    {
        var entity = new Models.DanhMuc
        {
            MaDanhMuc = request.MaDanhMuc,
            TenDanhMuc = request.TenDanhMuc,
            MaDanhMucCha = request.MaDanhMucCha
        };

        _dbContext.DanhMuc.Add(entity);
        await _dbContext.SaveChangesAsync();

        return CreatedAtAction(nameof(GetCategory), new { maDanhMuc = entity.MaDanhMuc }, entity);
    }

    [HttpPut("{maDanhMuc}")]
    public async Task<IActionResult> UpdateCategory(string maDanhMuc, [FromBody] UpdateCategoryRequest request)
    {
        var category = await _dbContext.DanhMuc.FirstOrDefaultAsync(x => x.MaDanhMuc == maDanhMuc);
        if (category is null) return NotFound();

        category.TenDanhMuc = request.TenDanhMuc;
        category.MaDanhMucCha = request.MaDanhMucCha;
        await _dbContext.SaveChangesAsync();

        return Ok(new { category.MaDanhMuc, category.TenDanhMuc, category.MaDanhMucCha });
    }

    [HttpDelete("{maDanhMuc}")]
    public async Task<IActionResult> DeleteCategory(string maDanhMuc)
    {
        var category = await _dbContext.DanhMuc.FirstOrDefaultAsync(x => x.MaDanhMuc == maDanhMuc);
        if (category is null) return NotFound();

        _dbContext.DanhMuc.Remove(category);
        await _dbContext.SaveChangesAsync();

        return NoContent();
    }
}

public record CreateCategoryRequest(string MaDanhMuc, string TenDanhMuc, string? MaDanhMucCha);
public record UpdateCategoryRequest(string TenDanhMuc, string? MaDanhMucCha);

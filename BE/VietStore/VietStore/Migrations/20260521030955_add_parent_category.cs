using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace VietStore.Migrations
{
    /// <inheritdoc />
    public partial class add_parent_category : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "MaDanhMucCha",
                table: "DanhMuc",
                type: "nvarchar(50)",
                maxLength: 50,
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "MaDanhMucCha",
                table: "DanhMuc");
        }
    }
}

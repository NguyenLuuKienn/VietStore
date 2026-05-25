using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace VietStore.Migrations
{
    /// <inheritdoc />
    public partial class add_stock_for_product : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "SoLuongTon",
                table: "SanPham",
                type: "int",
                nullable: false,
                defaultValue: 0);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "SoLuongTon",
                table: "SanPham");
        }
    }
}

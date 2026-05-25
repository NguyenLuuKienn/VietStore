using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace VietStore.Migrations
{
    /// <inheritdoc />
    public partial class add_IsFeaturedNew_and_IsFeaturedBestseller : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
                name: "IsFeaturedBestseller",
                table: "SanPham",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<bool>(
                name: "IsFeaturedNew",
                table: "SanPham",
                type: "bit",
                nullable: false,
                defaultValue: false);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "IsFeaturedBestseller",
                table: "SanPham");

            migrationBuilder.DropColumn(
                name: "IsFeaturedNew",
                table: "SanPham");
        }
    }
}

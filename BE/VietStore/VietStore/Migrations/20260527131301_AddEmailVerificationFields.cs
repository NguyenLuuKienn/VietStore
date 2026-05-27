using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace VietStore.Migrations
{
    /// <inheritdoc />
    public partial class AddEmailVerificationFields : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AlterColumn<bool>(
                name: "IsVisible",
                table: "SanPham",
                type: "bit",
                nullable: false,
                defaultValue: true,
                oldClrType: typeof(bool),
                oldType: "bit");

            migrationBuilder.AddColumn<bool>(
                name: "EmailDaXacThuc",
                table: "NguoiDung",
                type: "bit",
                nullable: false,
                defaultValue: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "HanXacThucEmail",
                table: "NguoiDung",
                type: "datetime2",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "MaXacThucEmail",
                table: "NguoiDung",
                type: "nvarchar(128)",
                maxLength: 128,
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "EmailDaXacThuc",
                table: "NguoiDung");

            migrationBuilder.DropColumn(
                name: "HanXacThucEmail",
                table: "NguoiDung");

            migrationBuilder.DropColumn(
                name: "MaXacThucEmail",
                table: "NguoiDung");

            migrationBuilder.AlterColumn<bool>(
                name: "IsVisible",
                table: "SanPham",
                type: "bit",
                nullable: false,
                oldClrType: typeof(bool),
                oldType: "bit",
                oldDefaultValue: true);
        }
    }
}

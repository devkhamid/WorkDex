using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace WorkDex.Api.Migrations
{
    /// <inheritdoc />
    public partial class RenameHakedisToWorkAmount : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.RenameColumn(
                name: "HakedisAmount",
                table: "WorkerPayments",
                newName: "WorkAmount");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.RenameColumn(
                name: "WorkAmount",
                table: "WorkerPayments",
                newName: "HakedisAmount");
        }
    }
}

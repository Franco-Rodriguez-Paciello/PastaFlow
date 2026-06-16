using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace PastaFlow.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class FixHistorialProduccionCostoColumns : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql("""
                ALTER TABLE "HistorialProduccion"
                    ADD COLUMN IF NOT EXISTS "CostoTotalReal" numeric(18,4) NOT NULL DEFAULT 0;

                ALTER TABLE "HistorialProduccion"
                    ADD COLUMN IF NOT EXISTS "CostoUnitarioReal" numeric(18,4) NOT NULL DEFAULT 0;
                """);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "CostoUnitarioReal",
                table: "HistorialProduccion");

            migrationBuilder.DropColumn(
                name: "CostoTotalReal",
                table: "HistorialProduccion");
        }
    }
}

using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace PastaFlow.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddInformesComprasInsight : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "InformesComprasInsight",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    Reporte = table.Column<string>(type: "text", nullable: false),
                    GeneradoEnUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    Origen = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    DiaOperativo = table.Column<string>(type: "character varying(10)", maxLength: 10, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_InformesComprasInsight", x => x.Id);
                });

            migrationBuilder.CreateIndex(
                name: "IX_InformesComprasInsight_GeneradoEnUtc",
                table: "InformesComprasInsight",
                column: "GeneradoEnUtc");

            migrationBuilder.CreateIndex(
                name: "IX_InformesComprasInsight_Origen_DiaOperativo",
                table: "InformesComprasInsight",
                columns: new[] { "Origen", "DiaOperativo" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "InformesComprasInsight");
        }
    }
}

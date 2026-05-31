using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace PastaFlow.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddUmbralCriticoToIngredientes : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<decimal>(
                name: "UmbralCritico",
                table: "Ingredientes",
                type: "numeric(18,4)",
                precision: 18,
                scale: 4,
                nullable: false,
                defaultValue: 5m);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "UmbralCritico",
                table: "Ingredientes");
        }
    }
}

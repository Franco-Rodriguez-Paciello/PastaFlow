using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace PastaFlow.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class FixTipoProductoToInt : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(
                @"ALTER TABLE ""Productos"" ALTER COLUMN ""TipoProducto"" TYPE integer USING ""TipoProducto""::integer;");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(
                @"ALTER TABLE ""Productos"" ALTER COLUMN ""TipoProducto"" TYPE text USING ""TipoProducto""::text;");
        }
    }
}

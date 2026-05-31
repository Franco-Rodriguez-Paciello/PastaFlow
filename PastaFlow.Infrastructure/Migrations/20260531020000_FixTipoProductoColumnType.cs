using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace PastaFlow.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class FixTipoProductoColumnType : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // Idempotent: only converts if the column is still 'text'.
            // Handles both numeric-string values ("0"/"1") stored by EF Core when the
            // column was text, and enum-name strings ("Simple"/"Compuesto") that may
            // have been inserted manually.
            migrationBuilder.Sql(@"
DO $$
BEGIN
    IF (SELECT data_type
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name   = 'Productos'
          AND column_name  = 'TipoProducto') = 'text' THEN

        ALTER TABLE ""Productos""
        ALTER COLUMN ""TipoProducto"" TYPE integer
        USING CASE
            WHEN ""TipoProducto"" IN ('0', 'Simple')    THEN 0
            WHEN ""TipoProducto"" IN ('1', 'Compuesto') THEN 1
            ELSE 0
        END;

    END IF;
END $$;
");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(@"
ALTER TABLE ""Productos""
ALTER COLUMN ""TipoProducto"" TYPE text
USING CASE
    WHEN ""TipoProducto"" = 0 THEN 'Simple'
    WHEN ""TipoProducto"" = 1 THEN 'Compuesto'
    ELSE 'Simple'
END;
");
        }
    }
}
